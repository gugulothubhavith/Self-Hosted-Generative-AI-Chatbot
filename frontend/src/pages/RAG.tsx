import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Upload, Search, FileText, Loader2, Database } from "lucide-react";

export default function RAG() {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post("/api/rag/upload", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      alert("Document uploaded successfully!");
      setFile(null);
    } catch (err: any) {
      alert(`Upload failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleQuery = async () => {
    if (!query.trim()) return;
    setLoading(true);

    try {
      const res = await axios.post(
        "/api/rag/query",
        { query },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResults(res.data.results);
    } catch (err: any) {
      alert(`Query failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#0B1120]">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Database className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Document Q&A</h1>
            <p className="text-gray-400">Upload documents and ask questions using RAG technology</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-emerald-400" />
                Upload Knowledge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-700 hover:border-emerald-500/50 rounded-xl p-8 transition-colors flex flex-col items-center justify-center text-center group cursor-pointer bg-gray-900/50">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="file-upload" className="w-full h-full flex flex-col items-center cursor-pointer">
                  <div className="h-12 w-12 bg-gray-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    {file ? <FileText className="h-6 w-6 text-emerald-400" /> : <Upload className="h-6 w-6 text-gray-400" />}
                  </div>
                  <h3 className="text-base font-medium text-white mb-1">
                    {file ? file.name : "Click to upload a document"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "PDF, TXT, or MD files up to 10MB"}
                  </p>
                </label>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {uploading ? "Uploading..." : "Add to Knowledge Base"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Query Section */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-400" />
                Ask Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What is discussed in the document?"
                  className="bg-gray-900/50"
                  onKeyDown={(e) => e.key === "Enter" && handleQuery()}
                />
                <Button onClick={handleQuery} disabled={!query.trim() || loading} variant="premium">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              <div className="space-y-3 mt-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {results.length > 0 ? (
                  results.map((result, idx) => (
                    <div key={idx} className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg text-sm text-gray-300 leading-relaxed animate-in fade-in slide-in-from-bottom-2">
                      {result}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    <Database className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p>No results yet. Ask a question to get started.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}