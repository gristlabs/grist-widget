const { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = Recharts;

const MarketMap = ({ data }) => {
  useEffect(() => {
    if (data && data.length > 0) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const L = window.L;
        const map = L.map('map').setView([44.0582, -121.3153], 7);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        const marketCoordinates = {
          'Portland': { lat: 45.5155, lng: -122.6789 },
          'Eugene': { lat: 44.0521, lng: -123.0868 },
          'Salem': { lat: 44.9429, lng: -123.0351 },
          'Bend': { lat: 44.0582, lng: -121.3153 },
          'Medford': { lat: 42.3265, lng: -122.8756 },
          'Albany': { lat: 44.6365, lng: -123.1059 },
          'Corvallis': { lat: 44.5646, lng: -123.2620 },
          'Grants Pass': { lat: 42.4393, lng: -123.3272 }
        };

        const latestYear = Math.max(...data.map(row => row.Year));
        const latestData = data.filter(row => row.Year === latestYear);

        latestData.forEach(row => {
          const coords = marketCoordinates[row.Market];
          if (coords) {
            const circle = L.circle([coords.lat, coords.lng], {
              radius: Math.sqrt(row['12 Mo  Sales Vol']) * 50,
              color: '#4e79a7',
              fillColor: '#4e79a7',
              fillOpacity: 0.5
            }).addTo(map);

            circle.bindPopup(`
              <b>${row.Market}</b><br>
              Sales Volume: $${(row['12 Mo  Sales Vol'] / 1000000).toFixed(2)}M<br>
              Cap Rate: ${row['Market Cap Rate']?.toFixed(2)}%
            `);
          }
        });
      };

      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.css';
        document.head.appendChild(link);
      }
    }
  }, [data]);

  return <div id="map" className="h-96 w-full rounded-lg" />;
};

const RetailDashboard = () => {
  const [data, setData] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState('Portland');
  const [selectedYear, setSelectedYear] = useState('all');
  const markets = ['Portland', 'Eugene', 'Salem', 'Bend', 'Medford', 'Albany', 'Corvallis', 'Grants Pass'];

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(`${process.env.PUBLIC_URL}/Markets.xlsx`);
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { range: 2 });
        setData(jsonData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  const filteredData = data.filter(row =>
    (selectedMarket === 'all' || row.Market === selectedMarket) &&
    (selectedYear === 'all' || row.Year === parseInt(selectedYear))
  );

  const years = [...new Set(data.map(row => row.Year))].sort();

  return (
    <div className="p-6 bg-gray-50">
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Oregon Retail Market Dashboard</h1>
          <div className="flex gap-4">
            <select
              className="p-2 border rounded"
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
            >
              <option value="all">All Markets</option>
              {markets.map(market => (
                <option key={market} value={market}>{market}</option>
              ))}
            </select>
            <select
              className="p-2 border rounded"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="all">All Years</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Cap Rates by Property Type</h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="Year" />
              <YAxis domain={[4, 10]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Market Cap Rate" name="All Retail" stroke="#4e79a7" />
              <Line type="monotone" dataKey="Market Cap Rate_1" name="Mall" stroke="#f28e2c" />
              <Line type="monotone" dataKey="Market Cap Rate_2" name="General Retail" stroke="#e15759" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Sales Volume Trends</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="Year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="12 Mo  Sales Vol" name="Sales Volume" fill="#4e79a7" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Price per SF by Property Type</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="Year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Market Sale Price/SF" name="All Retail" stroke="#4e79a7" />
                <Line type="monotone" dataKey="Market Sale Price/SF_1" name="Mall" stroke="#f28e2c" />
                <Line type="monotone" dataKey="Market Sale Price/SF_2" name="General Retail" stroke="#e15759" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Number of Sales</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="Year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Number of Sales" name="All Retail" fill="#4e79a7" />
                <Bar dataKey="Number of Sales_1" name="Mall" fill="#f28e2c" />
                <Bar dataKey="Number of Sales_2" name="General Retail" fill="#e15759" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Sales Volume Growth Rate</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="Year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="12 Mo Sales Vol Growth" name="Growth Rate %" stroke="#4e79a7" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Market Performance Map</h2>
        <MarketMap data={data} />
        <div className="mt-4 text-sm text-gray-600">
          <p>Circle size: Total Sales Volume | Color intensity: Cap Rate</p>
        </div>
      </div>
    </div>
  );
};

ReactDOM.render(<RetailDashboard />, document.getElementById('root'));
