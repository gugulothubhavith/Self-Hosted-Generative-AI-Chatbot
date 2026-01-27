import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Image as ImageIcon, Sparkles, Loader2, Download } from "lucide-react";

export default function ImageGen() {
  const { token } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);

    try {
      const res = await axios.post(
        "/api/image/generate",
        { prompt },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setImages((prev) => [res.data.image_url, ...prev]);
    } catch (err: any) {
      alert(`Generation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `generated-image-${Date.now()}-${index}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed, opening in new tab:", error);
      window.open(url, '_blank');
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#0B1120]">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
            <ImageIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Image Generation</h1>
            <p className="text-gray-400">Create stunning visuals with Stable Diffusion XL</p>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex gap-4 relative z-10">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder="Describe the image you want to generate... (e.g., 'A cyberpunk city in rain, neon lights, highly detailed')"
              className="h-14 text-base bg-gray-950/50 border-gray-700 focus:border-pink-500/50 focus:ring-pink-500/20 rounded-xl"
            />
            <Button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="h-14 px-8 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-lg shadow-pink-500/20"
            >
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
              Generate
            </Button>
          </div>
        </div>

        {/* Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && (
            <div className="aspect-square rounded-2xl bg-gray-900 border border-gray-800 animate-pulse flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
                <span className="text-sm font-medium">Dreaming...</span>
              </div>
            </div>
          )}

          {images.map((img, idx) => (
            <div key={idx} className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 shadow-lg transition-all hover:scale-[1.02] hover:shadow-pink-500/10 hover:border-pink-500/50">
              <img
                src={img}
                alt={`Generated ${idx}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                <Button variant="secondary" size="sm" className="rounded-full" onClick={() => handleDownload(img, idx)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          ))}

          {!loading && images.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-gray-800 rounded-2xl bg-gray-900/20">
              <Sparkles className="h-10 w-10 mb-4 opacity-20" />
              <p>Your generated images will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}