import requests

# 测试登录
print("测试登录API...")
login_response = requests.post('http://localhost:3000/api/auth/login', json={
    'email': 'admin@ai.com',
    'password': 'admin123'
})
print(f"登录状态码: {login_response.status_code}")
login_data = login_response.json()
print(f"登录响应: {login_data}")

if login_response.status_code == 200 and login_data.get('data', {}).get('accessToken'):
    token = login_data['data']['accessToken']
    print(f"\n获取的Token: {token[:20]}...")
    
    # 测试供应商API
    print("\n测试供应商API...")
    headers = {'Authorization': f'Bearer {token}'}
    providers_response = requests.get('http://localhost:3000/api/pricing-admin/upstream/providers', headers=headers)
    print(f"供应商API状态码: {providers_response.status_code}")
    print(f"供应商API响应: {providers_response.text}")
else:
    print("登录失败!")
