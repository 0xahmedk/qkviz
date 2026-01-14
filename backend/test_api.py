"""
Test the API endpoints to ensure backward compatibility.
"""

import requests
import json

def test_generate_endpoint():
    """Test that the /generate endpoint still works"""
    print("=== Testing /generate Endpoint ===\n")
    
    url = "http://localhost:8000/generate"
    payload = {
        "context": "The",
        "temperature": 1.0,
        "top_k": 5
    }
    
    try:
        response = requests.post(url, json=payload)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ /generate endpoint works!")
            print(f"  - Context: {data['context']}")
            print(f"  - Generated token: {data['generated_token']}")
            print(f"  - Top predictions: {len(data['next_token_predictions'])}")
            return True
        else:
            print(f"❌ Error: Status code {response.status_code}")
            print(f"  - Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        print("  - Make sure the server is running: python main.py")
        return False


def test_simulate_endpoint():
    """Test the new /api/simulate endpoint"""
    print("\n=== Testing /api/simulate Endpoint ===\n")
    
    url = "http://localhost:8000/api/simulate"
    payload = {
        "text": "The cat sat on the mat.",
        "epochs": 5,
        "lr": 0.01
    }
    
    try:
        response = requests.post(url, json=payload)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ /api/simulate endpoint works!")
            print(f"  - Vocabulary size: {data['vocab_size']}")
            print(f"  - Number of epochs: {len(data['history'])}")
            print(f"  - Initial loss: {data['history'][0]['loss']:.4f}")
            print(f"  - Final loss: {data['history'][-1]['loss']:.4f}")
            return True
        else:
            print(f"❌ Error: Status code {response.status_code}")
            print(f"  - Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        print("  - Make sure the server is running: python main.py")
        return False


def test_health_endpoint():
    """Test the /health endpoint"""
    print("\n=== Testing /health Endpoint ===\n")
    
    url = "http://localhost:8000/health"
    
    try:
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ /health endpoint works!")
            print(f"  - Status: {data['status']}")
            print(f"  - Model loaded: {data['model_loaded']}")
            print(f"  - Device: {data['device']}")
            return True
        else:
            print(f"❌ Error: Status code {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        print("  - Make sure the server is running: python main.py")
        return False


if __name__ == "__main__":
    print("🧪 Testing API Endpoints\n")
    print("Note: Make sure the server is running with: python main.py\n")
    print("=" * 60)
    
    health_ok = test_health_endpoint()
    generate_ok = test_generate_endpoint()
    simulate_ok = test_simulate_endpoint()
    
    print("\n" + "=" * 60)
    print("\n📊 Test Results:")
    print(f"  - Health endpoint: {'✅' if health_ok else '❌'}")
    print(f"  - Generate endpoint: {'✅' if generate_ok else '❌'}")
    print(f"  - Simulate endpoint: {'✅' if simulate_ok else '❌'}")
    
    if all([health_ok, generate_ok, simulate_ok]):
        print("\n🎉 All API tests passed!")
    else:
        print("\n⚠️  Some tests failed. Check the output above for details.")
