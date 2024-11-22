const chartElement = document.getElementById('chart');
const coinSelect = document.getElementById('coin-select');
const intervalSelect = document.getElementById('interval-select');

const chartOptions = {
    layout: {
        textColor: 'black',
        background: { type: 'solid', color: 'white' },
    },
    rightPriceScale: {
        visible: true,
        borderVisible: true,
        scaleMargins: {
            top: 0.1,
            bottom: 0.1,
        },
    },
};

let chart = LightweightCharts.createChart(chartElement, chartOptions);
let candlestickSeries = chart.addCandlestickSeries({
    upColor: '#26a69a',
    downColor: '#ef5350',
    borderVisible: false,
    wickUpColor: '#26a69a',
    wickDownColor: '#ef5350',
});



// function connectWebSocket(symbol, interval) {
//     if (socket && socket.readyState === WebSocket.OPEN) {
//         return; // Don't reconnect if already open
//     }

//     socket = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@kline_${interval}`);

//     // socket = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@kline_${interval}`);



//     socket.onmessage = (event) => {
//         const message = JSON.parse(event.data);
//         const kline = message.k;
//         console.log('Gelen mesaj:', message); //

//         const candlestickData = {
//             time: kline.t / 1000,
//             open: parseFloat(kline.o),
//             high: parseFloat(kline.h),
//             low: parseFloat(kline.l),
//             close: parseFloat(kline.c),
//         };

//         if (kline.x) {
//             candlestickSeries.update(candlestickData);
//         }
//         chart.timeScale().fitContent();
//     };

//     socket.onerror = (error) => {
//         console.error('WebSocket error: ', error);
//     };
// }

// coinSelect.addEventListener('change', () => {
//     const selectedCoin = coinSelect.value;
//     const selectedInterval = intervalSelect.value;

//     chart.removeSeries(candlestickSeries);
//     candlestickSeries = chart.addCandlestickSeries({
//         upColor: '#26a69a',
//         downColor: '#ef5350',
//         borderVisible: false,
//         wickUpColor: '#26a69a',
//         wickDownColor: '#ef5350',
//     });

//     connectWebSocket(selectedCoin, selectedInterval);
// });

// intervalSelect.addEventListener('change', () => {
//     const selectedCoin = coinSelect.value;
//     const selectedInterval = intervalSelect.value;

//     chart.removeSeries(candlestickSeries);
//     candlestickSeries = chart.addCandlestickSeries({
//         upColor: '#26a69a',
//         downColor: '#ef5350',
//         borderVisible: false,
//         wickUpColor: '#26a69a',
//         wickDownColor: '#ef5350',
//     });

//     connectWebSocket(selectedCoin, selectedInterval);
// });

// // Varsayılan değer
// connectWebSocket('btcusdt', '1m');

let socket;

function connectWebSocket(symbol, interval) {
    // Eski bağlantıyı kapat
    if (socket) {
        socket.onclose = () => {
            console.log('Eski bağlantı kapandı, yeni bağlantı başlatılıyor...');
            startNewWebSocket(symbol, interval); // Yeni bağlantıyı başlat
        };
        socket.close(); // Bağlantıyı kapat
    } else {
        startNewWebSocket(symbol, interval); // İlk kez bağlantı başlat
    }
}

function startNewWebSocket(symbol, interval) {
    socket = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@kline_${interval}`);

    socket.onopen = () => {
        console.log(`Bağlantı kuruldu: ${symbol} @ ${interval}`);
    };

    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        const kline = message.k;
        console.log('Gelen mesaj:', message);

        const candlestickData = {
            time: kline.t / 1000,
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c),
        };

        if (kline.x) {
            candlestickSeries.update(candlestickData);
        }
        chart.timeScale().fitContent();
    };

    socket.onerror = (error) => {
        console.error('WebSocket error: ', error);
    };

    socket.onclose = () => {
        console.log(`Bağlantı kapandı: ${symbol} @ ${interval}`);
    };
}

coinSelect.addEventListener('change', () => {
    const selectedCoin = coinSelect.value;
    const selectedInterval = intervalSelect.value;

    chart.removeSeries(candlestickSeries);
    candlestickSeries = chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
    });

    connectWebSocket(selectedCoin, selectedInterval);
});

intervalSelect.addEventListener('change', () => {
    const selectedCoin = coinSelect.value;
    const selectedInterval = intervalSelect.value;

    chart.removeSeries(candlestickSeries);
    candlestickSeries = chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
    });

    connectWebSocket(selectedCoin, selectedInterval);
});

// Varsayılan değer
connectWebSocket('btcusdt', '1m');

