'use client';

import ReactECharts from 'echarts-for-react';

export function ShiftProductionChart({ data, xAxisData }: { data: number[], xAxisData?: string[] }) {
  const options = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: xAxisData || ['Shift 1', 'Shift 2', 'Shift 3', 'Official'],
      axisLabel: { color: '#a1a1aa' },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#a1a1aa' },
      splitLine: { lineStyle: { color: '#27272a' } },
    },
    series: [
      {
        data: data || [0, 0, 0, 0],
        type: 'line',
        label: { show: true, position: 'top', color: '#fff' },
        smooth: true,
        lineStyle: { width: 3, color: '#3b82f6' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(59, 130, 246, 0.5)' }, { offset: 1, color: 'rgba(59, 130, 246, 0)' }]
          }
        },
        itemStyle: { color: '#3b82f6' },
      }
    ]
  };

  return <ReactECharts option={options} style={{ height: '300px' }} />;
}

export function TargetVsActualChart({ categories, targetData, actualData }: { categories: string[], targetData: number[], actualData: number[] }) {
  const options = {
    tooltip: { trigger: 'axis' },
    legend: { textStyle: { color: '#a1a1aa' }, top: 0 },
    xAxis: {
      type: 'category',
      data: categories || [],
      axisLabel: { color: '#a1a1aa' },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#a1a1aa' },
      splitLine: { lineStyle: { color: '#27272a' } },
    },
    series: [
      {
        name: 'Target',
        type: 'bar',
        data: targetData || [],
        label: { show: true, position: 'top', color: '#fff' },
        itemStyle: { color: '#27272a', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: 'Actual',
        type: 'bar',
        data: actualData || [],
        label: { show: true, position: 'top', color: '#fff' },
        itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] },
      }
    ]
  };

  return <ReactECharts option={options} style={{ height: '300px' }} />;
}

export function AchievementGauge({ achieved, target }: { achieved: number, target: number }) {
  const options = {
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        center: ['50%', '75%'],
        radius: '100%',
        min: 0,
        max: 1000,
        splitNumber: 10,
        axisLine: {
          lineStyle: {
            width: 15,
            color: [[0.8, '#ef4444'], [0.9, '#f59e0b'], [1, '#10b981']],
          }
        },
        pointer: {
          icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
          length: '12%',
          width: 20,
          offsetCenter: [0, '-60%'],
          itemStyle: { color: 'auto' }
        },
        axisTick: { length: 12, lineStyle: { color: 'auto', width: 2 } },
        splitLine: { length: 20, lineStyle: { color: 'auto', width: 5 } },
        axisLabel: { color: '#a1a1aa', distance: -60, fontSize: 14 },
        title: { offsetCenter: [0, '-10%'], textStyle: { fontSize: 14, color: '#a1a1aa' } },
        detail: { fontSize: 30, offsetCenter: [0, '20%'], valueAnimation: true, formatter: '{value}', color: 'auto' },
        data: [{ value: achieved, name: 'Achieved' }]
      }
    ]
  };

  return <ReactECharts option={options} style={{ height: '300px' }} />;
}

export function MonthlyAggregationChart({ dbData, division, year }: { dbData: any[], division: string, year: string }) {
  const isWater = division === 'water';
  const data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  
  dbData.forEach(d => {
    if (d.date && d.date.startsWith(year)) {
      const monthIndex = new Date(d.date).getMonth();
      const val = isWater ? (d.packaging || 0) : (d.multy_test || 0);
      data[monthIndex] += val;
    }
  });

  const options = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], axisLabel: { color: '#a1a1aa' } },
    yAxis: { type: 'value', axisLabel: { color: '#a1a1aa' }, splitLine: { lineStyle: { color: '#27272a' } } },
    series: [{ type: 'bar', data: data, label: { show: true, position: 'top', color: '#fff' }, itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] } }]
  };

  return <ReactECharts option={options} style={{ height: '400px' }} />;
}

export function YearlyGrowthChart({ dbData, division }: { dbData: any[], division: string }) {
  const isWater = division === 'water';
  const getDailyTotal = (d: any) => isWater ? (d.packaging || 0) : (d.multy_test || 0);

  const startYear = isWater ? 2025 : 2023;
  const numYears = 5;
  const data = Array(numYears).fill(0);
  const yearsLabels = Array.from({ length: numYears }, (_, i) => (startYear + i).toString());

  dbData.forEach(d => {
    if (d.date) {
      const year = new Date(d.date).getFullYear();
      const index = year - startYear;
      if (index >= 0 && index < numYears) {
        data[index] += getDailyTotal(d);
      }
    }
  });

  const options = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: yearsLabels, axisLabel: { color: '#a1a1aa' } },
    yAxis: { type: 'value', axisLabel: { color: '#a1a1aa' }, splitLine: { lineStyle: { color: '#27272a' } } },
    series: [{ type: 'bar', data: data, label: { show: true, position: 'top', color: '#fff' }, itemStyle: { color: '#8b5cf6', borderRadius: [4, 4, 0, 0] } }]
  };
  return <ReactECharts option={options} style={{ height: '300px' }} />;
}
