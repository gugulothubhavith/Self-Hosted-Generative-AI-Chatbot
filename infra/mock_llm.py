import http.server
import json
import socketserver

PORT = 8000

class MockLLMHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"OK")
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        response = {}
        if "chat/completions" in self.path:
            response = {
                "id": "mock-response",
                "object": "chat.completion",
                "created": 1234567890,
                "model": "mock-model",
                "choices": [{
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": "This is a response from the mock LLM service. The real models are disabled to save resources."
                    },
                    "finish_reason": "stop"
                }]
            }
        elif "completions" in self.path:
            response = {
                "id": "mock-response",
                "object": "text_completion",
                "created": 1234567890,
                "model": "mock-model",
                "choices": [{
                    "text": "This is a response from the mock LLM service. The real models are disabled to save resources.",
                    "index": 0,
                    "logprobs": None,
                    "finish_reason": "length"
                }]
            }
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode('utf-8'))

with socketserver.TCPServer(("", PORT), MockLLMHandler) as httpd:
    print(f"Serving Mock LLM on port {PORT}")
    httpd.serve_forever()
