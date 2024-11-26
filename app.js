// const chartElement = document.getElementById('chart');
// const coinSelect = document.getElementById('coin-select');
// const intervalSelect = document.getElementById('interval-select');

// const chartOptions = {
//     layout: {
//         textColor: 'black',
//         background: { type: 'solid', color: 'white' },
//     },
//     rightPriceScale: {
//         visible: true,
//         borderVisible: true,
//         scaleMargins: {
//             top: 0.1,
//             bottom: 0.1,
//         },
//     },
// };

// let chart = LightweightCharts.createChart(chartElement, chartOptions);
// let candlestickSeries = chart.addCandlestickSeries({
//     upColor: '#26a69a',
//     downColor: '#ef5350',
//     borderVisible: false,
//     wickUpColor: '#26a69a',
//     wickDownColor: '#ef5350',
// });



// let socket;

// function connectWebSocket(symbol, interval) {
//     //  Eski bağlantıyı kapat
//     if (socket) {
//         socket.onclose = () => {
//             console.log('Eski bağlantı kapandı, yeni bağlantı başlatılıyor...');
//             startNewWebSocket(symbol, interval); // Yeni bağlantıyı başlat
//         };
//         socket.close(); // Bağlantıyı kapat
//     } else {
//         startNewWebSocket(symbol, interval); // İlk kez bağlantı başlat
//     }
// }

// function startNewWebSocket(symbol, interval) {
//     socket = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@kline_${interval}`);

//     socket.onopen = () => {
//         console.log(`Bağlantı kuruldu: ${symbol} @ ${interval}`);
//     };

//     socket.onmessage = (event) => {
//         const message = JSON.parse(event.data);
//         const kline = message.k;
//         console.log('Gelen mesaj:', message);

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

//     socket.onclose = () => {
//         console.log(`Bağlantı kapandı: ${symbol} @ ${interval}`);
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

// //Varsayılan değer
// connectWebSocket('btcusdt', '1m');

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

const limit = 500; // Binance API's max limit
let isLoading = false;
let oldestTimestamp = null;

async function fetchHistoricalData(symbol, interval, startTime, endTime) {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}${startTime ? `&startTime=${startTime}` : ''}${endTime ? `&endTime=${endTime}` : ''}`;
    const response = await fetch(url);
    const data = await response.json();

    return data.map((item) => ({
        time: item[0] / 1000, // Convert timestamp to seconds
        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
    }));
}

async function loadInitialData(symbol, interval) {
    const endTime = Date.now();
    const historicalData = await fetchHistoricalData(symbol, interval, null, endTime);

    if (historicalData.length > 0) {
        oldestTimestamp = historicalData[0].time * 1000; // Oldest timestamp in ms
        candlestickSeries.setData(historicalData);
    }
}

async function loadMoreData(symbol, interval) {
    if (isLoading || !oldestTimestamp) return;
    isLoading = true;

    const moreData = await fetchHistoricalData(symbol, interval, oldestTimestamp);
    if (moreData.length > 0) {
        oldestTimestamp = moreData[0].time * 1000; // Update oldest timestamp
        candlestickSeries.setData([...moreData, ...candlestickSeries.getData()]); // Merge new data
    }

    isLoading = false;
}

function connectWebSocket(symbol, interval) {
    const socket = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@kline_${interval}`);

    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        const kline = message.k;

        const candlestickData = {
            time: kline.t / 1000, // Convert timestamp to seconds
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c),
        };

        // Validate the time data to ensure it's correct
        if (typeof candlestickData.time !== 'number' || isNaN(candlestickData.time)) {
            console.error('Invalid candlestick timestamp:', candlestickData.time);
            return;
        }

        if (kline.x) { // Only update if the kline is complete
            // Ensure that the new timestamp is greater than the oldest
            if (oldestTimestamp && candlestickData.time < oldestTimestamp / 1000) {
                console.error('Cannot update with older data:', candlestickData.time);
                return;
            }

            candlestickSeries.update(candlestickData);
        }
    };


    socket.onerror = (error) => {
        console.error('WebSocket error: ', error);
    };

    socket.onclose = () => {
        console.log('WebSocket connection closed.');
    };
}

chart.timeScale().subscribeVisibleLogicalRangeChange(async (newRange) => {
    if (!newRange || newRange.from < 0 || isLoading) return; // Check if newRange is valid
    const selectedCoin = coinSelect.value;
    const selectedInterval = intervalSelect.value;
    await loadMoreData(selectedCoin, selectedInterval);
});


coinSelect.addEventListener('change', async () => {
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

    await loadInitialData(selectedCoin, selectedInterval);
    connectWebSocket(selectedCoin, selectedInterval);
});

intervalSelect.addEventListener('change', async () => {
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

    await loadInitialData(selectedCoin, selectedInterval);
    connectWebSocket(selectedCoin, selectedInterval);
});

// Varsayılan başlangıç
const defaultCoin = 'btcusdt';
const defaultInterval = '1m';
loadInitialData(defaultCoin, defaultInterval);
connectWebSocket(defaultCoin, defaultInterval);

