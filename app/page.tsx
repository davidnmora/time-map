import App from "./components/App";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";

export default function Home() {
  return (
    <div className="h-screen w-screen">
      <App />
    </div>
  );
}
