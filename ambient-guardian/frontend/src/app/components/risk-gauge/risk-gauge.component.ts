import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import * as echarts from 'echarts/core';
import { GaugeChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { ECharts, EChartsCoreOption } from 'echarts/core';

import { GuardianStatus } from '../../models/dashboard.models';

echarts.use([GaugeChart, GridComponent, TooltipComponent, CanvasRenderer]);

@Component({
  selector: 'app-risk-gauge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './risk-gauge.component.html',
  styleUrl: './risk-gauge.component.scss'
})
export class RiskGaugeComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() riskScore = 0;
  @Input() status: GuardianStatus = 'NORMAL';

  @ViewChild('chartHost', { static: true }) private chartHost!: ElementRef<HTMLDivElement>;

  private chart?: ECharts;
  private readonly resizeObserver = new ResizeObserver(() => this.chart?.resize());

  ngAfterViewInit(): void {
    this.chart = echarts.init(this.chartHost.nativeElement, undefined, { renderer: 'canvas' });
    this.resizeObserver.observe(this.chartHost.nativeElement);
    this.renderChart();
  }

  ngOnChanges(_: SimpleChanges): void {
    this.renderChart();
  }

  ngOnDestroy(): void {
    this.resizeObserver.disconnect();
    this.chart?.dispose();
  }

  private renderChart(): void {
    if (!this.chart) {
      return;
    }

    const color = this.status === 'CRITICAL' ? '#ff4d6d' : this.status === 'WARNING' ? '#ffb84d' : '#2fffa8';
    const option: EChartsCoreOption = {
      tooltip: { show: false },
      series: [
        {
          type: 'gauge',
          startAngle: 210,
          endAngle: -30,
          min: 0,
          max: 100,
          radius: '92%',
          progress: {
            show: true,
            width: 16,
            roundCap: true,
            itemStyle: {
              color
            }
          },
          axisLine: {
            roundCap: true,
            lineStyle: {
              width: 16,
              color: [[0.4, '#1f8f68'], [0.7, '#a66f22'], [1, '#8f2338']]
            }
          },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          pointer: {
            show: true,
            length: '58%',
            width: 5,
            itemStyle: {
              color: '#dbeafe'
            }
          },
          anchor: {
            show: true,
            size: 11,
            itemStyle: {
              color: '#dbeafe',
              borderWidth: 0
            }
          },
          detail: {
            valueAnimation: true,
            formatter: '{value}%',
            offsetCenter: [0, '42%'],
            color: '#f8fafc',
            fontSize: 34,
            fontWeight: 700
          },
          title: {
            show: true,
            offsetCenter: [0, '68%'],
            color: '#94a3b8',
            fontSize: 12
          },
          data: [{ value: this.riskScore, name: this.status }]
        }
      ]
    };

    this.chart.setOption(option, true);
  }
}
