import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';

import './App.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
  {
    id: '1',
    afterDraw: function (chart, easing) {
      if (chart.tooltip._active && chart.tooltip._active.length) {
        const activePoint = chart.tooltip._active[0];
        const ctx = chart.ctx;
        const x = activePoint.element.x;
        const topY = chart.scales.y.top;
        const bottomY = chart.scales.y.bottom;
        ctx.save();

        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';

        ctx.beginPath();
        ctx.moveTo(x, topY);
        ctx.lineTo(x, bottomY);

        ctx.stroke();
        ctx.restore();
      }
    }
  }
);

Tooltip.positioners.customPositioner = function(items) {
  const pos = Tooltip.positioners.average(items);

  // Happens when nothing is found
  if (pos === false) {
    return false;
  }

  const chart = this.chart;

  return {
    x: pos.x,
    y: chart.chartArea.top,
    xAlign: 'center',
    yAlign: 'bottom',
  };
};

export const options = {
  responsive: true,
  plugins: {
    legend: {
        display: false,
    },
    tooltip: {
      displayColors: false,
      intersect: false,

      position: 'customPositioner',
      yAlign : 'bottom',
      xAlign : 'center',

      backgroundColor: 'rgba(255, 255, 255, 1)',
      titleColor: 'black',
      titleAlign: 'left',
      bodyColor: 'black',
      borderColor: 'rgba(0, 0, 0, 0.4)',
      borderWidth: 0.5,
      caretSize: 0,
    }
  },
  interaction: {
    mode: 'index',
    intersect: false,
  },
  scales: {
      x: {
        grid: {
          // display: false,
          color: 'transparent',
          tickColor: (context) => {
            if (context?.index === 0 || context?.index === 5) return 'transparent';
            return 'gray';
          },
          borderColor: 'gray',
        },
        ticks: {
          maxTicksLimit: 7,
          maxRotation: 0,
          minRotation: 0,
          padding: 7,
        },
      },
      y: {
        grid: {
          borderColor: 'transparent',
        },
        ticks: {
          maxTicksLimit: 5,
          padding: 7,
        },
      }
  },
  elements: {
      point: {
          radius: 0,
      },
  },
};

const PERIOD = {
  daily: 'd',
  weekly: 'w',
  monthly : 'm'
}

const getByDay = {
  '5D': {
    from: dayjs().startOf('w').format('YYYY-MM-DD'),
    to: dayjs().endOf('w').format('YYYY-MM-DD')
  },

}


function App() {
  const [period, setPeriod] = useState(PERIOD.daily);
  const [stockData, setStockData] = useState(null);
  
  useEffect(() => {
    axios.get(`https://eodhistoricaldata.com/api/eod/MCD.US?api_token=demo&fmt=json&period=${period}`).then((response) => {
      if (period === PERIOD.daily) {
        const last5 = response.data.slice(-6);
        setStockData(last5);
      } else {
        setStockData(response.data);
      }
    });
  }, [period]);

  if (!stockData) return (<div>loading...</div>)

  const labels = stockData?.map((el, index) => {
    if (index === 0 || index === stockData?.length - 1) return "";
    return dayjs(el.date)?.format('MMM D');
  });

  const bgGradient = (ctx, chartArea, scales) => {
    const { left, right, top, bottom, width, height } = chartArea;
    const { x, y } = scales;
    const gradientBg = ctx.createLinearGradient(0, top, 0, bottom);
    gradientBg.addColorStop(0, 'rgba(53, 168 , 83, 0.3)');
    gradientBg.addColorStop(1, 'rgba(53, 168 , 83, 0)');

    return gradientBg;
  }

  const dataChart = () => {
    return {
        labels,
        datasets: [
            {
                backgroundColor: (context) => {
                  const chart = context.chart;
                  const { ctx, chartArea, scales } = chart;

                  if (!chartArea) return null;

                  return bgGradient(ctx, chartArea, scales);
                },
                // backgroundColor: 'rgba(53, 168 , 83, 0.1)', 
                borderColor: '#35a853',
                borderWidth: 2,
                label: 'Stock price',
                data: stockData.map((el) => el.close),
                pointBackgroundColor:'#35a853',
                tension: 0.1,
                fill: true,
                pointRadius: (ctx) => {
                  const pointsLength = ctx.chart.data.labels.length - 1;
                  const pointsArray = [];
        
                  for (let i = 0; i <= pointsLength; i++) {
                    if (i === pointsLength) {
                      pointsArray.push(5);
                    } else {
                      pointsArray.push(0);
                    }
                  }
        
                  return pointsArray;
                }
            },
        ],
    };
  };
  
  return (
    <div className="App">
      <Line options={options} data={dataChart()} />
    </div>
  );
}

export default App;
