console.debug('[PSE] Revive!: Hello!');

let div = document.createElement('div');

div.setAttribute('style', 'height: 300px;');

let canvas = document.createElement('canvas');

canvas.setAttribute('style', 'max-height: 300px');

div.appendChild(canvas);

document.getElementById('pricehistory').after(div);

// let zoomControls = document.createElement('div');
//
// zoomControls.innerHTML = '<input id="xZoom" type="range" min="0" max="100" value="80" /><input id="yZoom" type="range" min="0" max="100" value="100" />';
//
// div.after(zoomControls);

let line1 = '';
let scripts = document.querySelectorAll('body script');

for (let i = 0, l = scripts.length; i < l; i ++) {
    line1 = (/var line1=(.*);/g.exec(scripts.item(i).innerHTML) ?? [])[1];

    if (line1) break;
}

let dates: string[] = [];
let prices: number[] = [];
let volumes: number[] = [];
let parsedLine: [string, number, string][] = JSON.parse(line1);

parsedLine.forEach(e => {
    let date = new Date(Date.parse(e[0]));
    dates.push(`${date.getDay()}.${date.getMonth()}.${date.getFullYear()}`);
    prices.push(e[1]);
    volumes.push(+e[2]);
});

console.debug(dates, prices, volumes);

let chart = new Chart.Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
        labels: dates,
        datasets: [
            {
                label: 'Price',
                data: prices,
                backgroundColor: '#688f3e',
                borderColor: '#688f3e',
                tension: 0.05,
                pointStyle: 'cross',
                pointRadius: 1,
                pointHitRadius: 2,
                pointHoverRadius: 5
            },
            {
                hidden: true,
                label: 'Volume',
                data: volumes,
                backgroundColor: '#6b8fc3',
                borderColor: '#6b8fc3',
                tension: 0.05,
                pointStyle: 'cross',
                pointRadius: 1,
                pointHitRadius: 2,
                pointHoverRadius: 5
            }
        ]
    },
    options: {
        scales: {
            x: {
                grid: {
                    color: '#1b2939'
                }
            },
            y: {
                grid: {
                    color: '#1b2939'
                }
            }
        },
        interaction: {
            intersect: false,
            mode: 'index'
        },
        plugins: {
            tooltip: {
                position: 'nearest',
                callbacks: {
                    label: (e) => {
                        let pricesDatasetMeta = e.chart.getDatasetMeta(0);
                        let volumesDatasetMeta = e.chart.getDatasetMeta(1);

                        let price = prices[e.dataIndex];
                        let volume = volumes[e.dataIndex];

                        // console.debug(price, pricesDatasetMeta, volume, volumesDatasetMeta, e);

                        if (pricesDatasetMeta.hidden || !pricesDatasetMeta.visible || volumesDatasetMeta.hidden || !volumesDatasetMeta.visible) {
                            return `${sprintf('%0.2f', price)} - ${volume} sold.`;
                        }

                        if (e.dataset.label == 'Price') {
                            return `${sprintf('%0.2f', price)}`;
                        }

                        if (e.dataset.label == 'Volume') {
                            return `${volume} sold.`;
                        }

                        return e.formattedValue;
                    }
                }
            }
        }
    }
});

// let xInZoom = <HTMLInputElement>document.getElementById('xZoom');
// let yInZoom = <HTMLInputElement>document.getElementById('yZoom');
//
// xInZoom.addEventListener('change', () => {
//     chart.options.scales.x.min = chart.scales['x'].max - (chart.scales['x'].max * (1 - (+xInZoom.value / 100)));
//     chart.update();
// });
//
// yInZoom.addEventListener('change', () => {
//     chart.options.scales.y.max = chart.scales['y'].max - (chart.scales['y'].max * (1 - (+yInZoom.value / 100)));
//     chart.update();
// });
