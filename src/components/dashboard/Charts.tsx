'use client';

import ReactECharts from 'echarts-for-react';

export function HourlyProductionChart() {
  const options = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'],
      axisLabel: { color: '#a1a1aa' },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#a1a1aa' },
      splitLine: { lineStyle: { color: '#27272a' } },
    },
    series: [
      {
        data: [120, 200, 150, 280, 210, 240, 290, 310],
        type: 'line',
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

export function TargetVsActualChart() {
  const options = {
    tooltip: { trigger: 'axis' },
    legend: { textStyle: { color: '#a1a1aa' }, top: 0 },
    xAxis: {
      type: 'category',
      data: ['Assembly', 'Insulation', 'Calibration'],
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
        data: [1920, 1920, 1920],
        itemStyle: { color: '#27272a', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: 'Actual',
        type: 'bar',
        data: [1895, 1920, 1848],
        itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] },
      }
    ]
  };

  return <ReactECharts option={options} style={{ height: '300px' }} />;
}

export function AchievementGauge() {
  const options = {
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        center: ['50%', '75%'],
        radius: '100%',
        min: 0,
        max: 100,
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
        title: { offsetCenter: [0, '-20%'], fontSize: 14, color: '#a1a1aa' },
        detail: {
          fontSize: 30,
          offsetCenter: [0, '20%'],
          valueAnimation: true,
          formatter: '{value}%',
          color: 'inherit'
        },
        data: [{ value: 92, name: 'Achievement' }]
      }
    ]
  };

  return <ReactECharts option={options} style={{ height: '250px' }} />;
}
