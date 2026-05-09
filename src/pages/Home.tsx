// import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import MarketCard from '../components/MarketCard';

interface Market {
  id: string;
  name: string;
  delivery_day?: string;
  cutoff_time?: string;
  image_url: string;
}

const MARKET_IMAGES: Record<string, string> = {
  'tejuosho market': 'https://lh3.googleusercontent.com/aida-public/AB6AXuD97GFN2hIcM9XHiV98i_4xIyOO1lzofxEtNQkHN8j-KAp0ScXPlAXE3B3hVovjxYtU6cVtqi_eNbHqwiGtZn4Ktw6WJpk7gNNGGrxsSxRWmisf8AAkiuFp0sxsUioL96tdgCznhUGA6pJWopjNfVtL5GNAvf1MVg2_vGhssIQlR5HFz5TG_wD9aRFrJlpzo7hEe9HVZW8dVZROhrzGO1KsPWHL5NwMDdPM5HIPeP4j-TmF0d7A2lLBCknfNBqtCwZu_-gHdJAIzuU',
  'mile 12': 'https://lh3.googleusercontent.com/aida-public/AB6AXuB96odQCdM5-iFD9m1hfdZNk1RddOOYRxUq7Bd2K4P7JrtK6P8EPgI3DRFzkctvW05A7Uh7Dl8jjsmbsWeUjyFmtzZLI8UGShPmqzHRPYBDX9V00CLcpadpRqe2J4dF5W-d3sBRwAGxqspNM9DVG2VyaR2sIsEz8Ci-sCLkCwQComKphm0Rm1NeLKcnf6MueJBT5zYkuA_4vg_9YmIdG42WtnT_EEKr0XzQ_FNUyizDLRhhS57Etpb_eZBDHM53QBdqkesyiXZYnqc',
  'mushin market': 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVyTSa7V9i85QTfActnUSQqxjy9P8ZOur5DLnx3FNh9M3sgclY82nQj90hLgL7lKKzSTxTfTyHjx1sRVj0hll3aHPL8xidp1xMiCoHB_Qi8Cqu5ND1eUKuwzd8NvYR1u1Z_ImvSH5HyhPyPkcGNvak6nzend4MT4xSQa42lQ4Q3asnkmKXa_DJwtNracRXENwJqWcNF1_xjR4jw0gERtUlDVLBHh-ZEKI5jnC9WcJYqHbpn6h0BABo8JALvHMUef4GD3f0iKgTecE',
  'oyingbo': 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5TtkQ04FYHXuAjgkro5tNwF_iRJglJcUqNES36oBmIdiw_vZodP4qEMrCt71ETkiUL1MwZdMhzaWMv9RQq3vKKkllFGt9fiZq4RrBx2I1ImFxslKkbDqVj0cLQcw6rIgnq4INX3zj1Bt41xJAEIZbyiyLKe2uRXKxYok8GeuBTBpMtlTMpYaRTRulTYRemJ5y59B916kxm-vFi79sqy8U1f1-8hoLFbVe4DuLo8z7XVuS2s1lq1Vbm2cwUApI0ZjddUL0wQIrDGo',
  'trade fair': 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVyTSa7V9i85QTfActnUSQqxjy9P8ZOur5DLnx3FNh9M3sgclY82nQj90hLgL7lKKzSTxTfTyHjx1sRVj0hll3aHPL8xidp1xMiCoHB_Qi8Cqu5ND1eUKuwzd8NvYR1u1Z_ImvSH5HyhPyPkcGNvak6nzend4MT4xSQa42lQ4Q3asnkmKXa_DJwtNracRXENwJqWcNF1_xjR4jw0gERtUlDVLBHh-ZEKI5jnC9WcJYqHbpn6h0BABo8JALvHMUef4GD3f0iKgTecE', // Using Mushin as placeholder for now, similar chaotic market vibe
  'eko idumota': 'https://lh3.googleusercontent.com/aida-public/AB6AXuD97GFN2hIcM9XHiV98i_4xIyOO1lzofxEtNQkHN8j-KAp0ScXPlAXE3B3hVovjxYtU6cVtqi_eNbHqwiGtZn4Ktw6WJpk7gNNGGrxsSxRWmisf8AAkiuFp0sxsUioL96tdgCznhUGA6pJWopjNfVtL5GNAvf1MVg2_vGhssIQlR5HFz5TG_wD9aRFrJlpzo7hEe9HVZW8dVZROhrzGO1KsPWHL5NwMDdPM5HIPeP4j-TmF0d7A2lLBCknfNBqtCwZu_-gHdJAIzuU', // Using Tejuosho placeholder
  'oshodi': 'https://lh3.googleusercontent.com/aida-public/AB6AXuB96odQCdM5-iFD9m1hfdZNk1RddOOYRxUq7Bd2K4P7JrtK6P8EPgI3DRFzkctvW05A7Uh7Dl8jjsmbsWeUjyFmtzZLI8UGShPmqzHRPYBDX9V00CLcpadpRqe2J4dF5W-d3sBRwAGxqspNM9DVG2VyaR2sIsEz8Ci-sCLkCwQComKphm0Rm1NeLKcnf6MueJBT5zYkuA_4vg_9YmIdG42WtnT_EEKr0XzQ_FNUyizDLRhhS57Etpb_eZBDHM53QBdqkesyiXZYnqc', // Using Mile 12 placeholder
  'ketu market': 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5TtkQ04FYHXuAjgkro5tNwF_iRJglJcUqNES36oBmIdiw_vZodP4qEMrCt71ETkiUL1MwZdMhzaWMv9RQq3vKKkllFGt9fiZq4RrBx2I1ImFxslKkbDqVj0cLQcw6rIgnq4INX3zj1Bt41xJAEIZbyiyLKe2uRXKxYok8GeuBTBpMtlTMpYaRTRulTYRemJ5y59B916kxm-vFi79sqy8U1f1-8hoLFbVe4DuLo8z7XVuS2s1lq1Vbm2cwUApI0ZjddUL0wQIrDGo' // Using Oyingbo placeholder
};

export default function Home() {
  // const navigate = useNavigate();
  const [markets, setMarkets] = useState<Market[]>([]);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const response = await axios.get('/markets');
        setMarkets(response.data);
      } catch (error) {
        console.error('Failed to fetch markets', error);
      }
    };
    fetchMarkets();
  }, []);

  const getMarketImage = (name: string, defaultUrl: string) => {
    const normalizedName = name.toLowerCase();
    // Look for exact match or partial match
    const matchedKey = Object.keys(MARKET_IMAGES).find(key => normalizedName.includes(key));
    return matchedKey ? MARKET_IMAGES[matchedKey] : defaultUrl;
  };
    
  return (
    <div className="max-w-[1280px] mx-auto w-full px-6 md:px-10 lg:px-40 py-8">
      {/* Action Panel: Service Area */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-xl border border-[#dae7e5] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="material-symbols-outlined">location_on</span>
            </div>
            <div className="flex flex-col">
              <p className="text-[#101818] text-base font-bold">Lagos-only service</p>
              <p className="text-[#5e8d88] text-sm">We currently deliver fresh items and provide services exclusively within Lagos State.</p>
            </div>
          </div>
          <button className="flex items-center gap-2 text-sm font-bold text-primary hover:underline group">
            Change Location
            <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Page Heading */}
      <div className="mb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-[#101818] text-4xl font-extrabold tracking-tight">Shop by Market</h1>
            <p className="text-[#5e8d88] text-base max-w-lg">Sourced directly from Lagos' most vibrant hubs. Select a market to see today's freshest picks.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#5e8d88]">
            <span className="material-symbols-outlined text-sm">info</span>
            Next unified delivery: <span className="font-bold text-[#101818] ml-1">Thursday</span>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex border-b border-[#dae7e5] min-w-max">
          <button className="flex items-center gap-2 px-6 py-4 border-b-4 border-primary text-primary text-sm font-extrabold">
            <span className="material-symbols-outlined text-sm">apps</span>
            All Markets
          </button>
          <button className="flex items-center gap-2 px-6 py-4 border-b-4 border-transparent text-[#5e8d88] text-sm font-bold hover:text-primary hover:border-primary/30 transition-all">
            <span className="material-symbols-outlined text-sm">restaurant</span>
            Fresh Food
          </button>
          <button className="flex items-center gap-2 px-6 py-4 border-b-4 border-transparent text-[#5e8d88] text-sm font-bold hover:text-primary hover:border-primary/30 transition-all">
            <span className="material-symbols-outlined text-sm">checkroom</span>
            Fabric & Fashion
          </button>
          <button className="flex items-center gap-2 px-6 py-4 border-b-4 border-transparent text-[#5e8d88] text-sm font-bold hover:text-primary hover:border-primary/30 transition-all">
            <span className="material-symbols-outlined text-sm">inventory_2</span>
            General Goods
          </button>
          <button className="flex items-center gap-2 px-6 py-4 border-b-4 border-transparent text-[#5e8d88] text-sm font-bold hover:text-primary hover:border-primary/30 transition-all">
            <span className="material-symbols-outlined text-sm">palette</span>
            Artisanal
          </button>
        </div>
      </div>

      {/* Marketplace Grid (Bento Box Inspired) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {markets.map((market) => (
          <MarketCard 
            key={market.id}
            id={market.id}
            name={market.name}
            delivery_day={market.delivery_day || 'Saturday'}
            cutoff_time={market.cutoff_time || 'Friday 12:00 PM'}
            image_url={getMarketImage(market.name, market.image_url)}
          />
        ))}
      </div>

      {/* More Markets CTA */}
      <div className="mt-12 flex flex-col items-center justify-center p-8 rounded-2xl bg-primary/5 border-2 border-dashed border-primary/20">
        <span className="material-symbols-outlined text-4xl text-primary mb-2">map</span>
        <h4 className="text-lg font-bold text-[#101818]">Don't see your local market?</h4>
        <p className="text-[#5e8d88] mb-4 text-center">We're expanding rapidly across Lagos. Suggest a market for our next expansion.</p>
        <button className="px-6 py-2 border-2 border-primary text-primary font-bold text-sm rounded-lg hover:bg-primary hover:text-white transition-all">
          Suggest Market
        </button>
      </div>
    </div>
  );
}
