"""
从 Chrome 浏览器提取即梦(jimeng.jianying.com)的登录 Cookie
macOS 专用 - 需要 Keychain 授权
"""
import sqlite3, os, subprocess, shutil, tempfile, json, sys
from hashlib import pbkdf2_hmac

def main():
    # 从 Keychain 获取 Chrome 加密密钥
    result = subprocess.run(
        ['security', 'find-generic-password', '-s', 'Chrome Safe Storage', '-w'],
        capture_output=True, text=True, timeout=10
    )
    chrome_key = result.stdout.strip()
    if not chrome_key:
        print("ERROR: Cannot get Chrome key. Click 'Allow' in the Keychain popup.", file=sys.stderr)
        sys.exit(1)

    derived = pbkdf2_hmac('sha1', chrome_key.encode(), b'saltysalt', 1003, dklen=16)

    db_path = os.path.expanduser('~/Library/Application Support/Google/Chrome/Default/Cookies')
    tmp = tempfile.mktemp(suffix='.db')
    shutil.copy2(db_path, tmp)

    conn = sqlite3.connect(tmp)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT name, encrypted_value, host_key
        FROM cookies
        WHERE host_key LIKE '%jianying.com%' OR host_key LIKE '%jimeng%'
    """)

    try:
        from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
        from cryptography.hazmat.backends import default_backend
    except ImportError:
        print("Installing cryptography...", file=sys.stderr)
        subprocess.run([sys.executable, '-m', 'pip', 'install', 'cryptography', '-q'])
        from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
        from cryptography.hazmat.backends import default_backend

    cookies = {}
    for name, enc_value, host in cursor.fetchall():
        if not enc_value:
            continue
        if enc_value[:3] == b'v10':
            enc_data = enc_value[3:]
            iv = b' ' * 16
            cipher = Cipher(algorithms.AES(derived), modes.CBC(iv), backend=default_backend())
            decryptor = cipher.decryptor()
            decrypted = decryptor.update(enc_data) + decryptor.finalize()
            pad_len = decrypted[-1]
            if isinstance(pad_len, int) and 0 < pad_len <= 16:
                decrypted = decrypted[:-pad_len]
            cookies[name] = decrypted.decode('utf-8', errors='replace')
        else:
            cookies[name] = enc_value.decode('utf-8', errors='replace')

    conn.close()
    os.unlink(tmp)

    important = ['sessionid', 'sessionid_ss', 'sid_tt', 'sid_guard',
                 'uid_tt', 'uid_tt_ss', 'passport_csrf_token',
                 'passport_csrf_token_default', 'ttwid', 'odin_tt',
                 'sid_ucp_v1', 'ssid_ucp_v1', 's_v_web_id']

    found = {k: cookies[k] for k in important if k in cookies}

    print(f"Found {len(found)}/{len(important)} important cookies", file=sys.stderr)
    for k, v in found.items():
        preview = v[:40] + '...' if len(v) > 40 else v
        print(f"  {k} = {preview}", file=sys.stderr)

    # Output full cookie string to stdout (for piping)
    cookie_str = '; '.join(f'{k}={v}' for k, v in cookies.items() if v)
    print(cookie_str)

    # Also save to .env format
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.jimeng-cookies.json')
    with open(env_path, 'w') as f:
        json.dump(cookies, f, indent=2)
    print(f"\nSaved to {env_path}", file=sys.stderr)

if __name__ == '__main__':
    main()
