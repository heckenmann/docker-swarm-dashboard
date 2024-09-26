import { Card } from 'react-bootstrap'
import { useAtomValue } from 'jotai'
import ReactApexChart from 'react-apexcharts'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
  isDarkModeAtom,
  serviceNameFilterAtom,
  stackNameFilterAtom,
  timelineAtom,
} from '../common/store/atoms'
import { FilterComponent } from './FilterComponent'

/**
 * TimelineComponent is a React functional component that renders a timeline chart
 * using ReactApexChart. It filters and maps tasks data to display them in a range bar chart.
 */
function TimelineComponent() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const isDark = useAtomValue(isDarkModeAtom)
  const serviceNameFilter = useAtomValue(serviceNameFilterAtom)
  const stackNameFilter = useAtomValue(stackNameFilterAtom)

  const tasks = useAtomValue(timelineAtom)
  const grouped = true

  const series = tasks
    .filter((task) =>
      serviceNameFilter ? task.ServiceName.includes(serviceNameFilter) : true,
    )
    .filter((task) =>
      stackNameFilter ? task.Stack.includes(stackNameFilter) : true,
    )
    .map((task) => {
      return {
        name: task.ServiceName + ' ' + task.Slot + ' (' + task.ID + ')',
        data: [
          {
            x: task.ServiceName + '_' + task.Slot,
            y: [
              new Date(task.CreatedTimestamp).getTime(),
              task.StoppedTimestamp === ''
                ? new Date().getTime()
                : new Date(task.StoppedTimestamp).getTime(),
            ],
          },
        ],
      }
    })

  /**
   * Calculates the height of the chart based on whether the tasks are grouped.
   * If grouped, the height is determined by the number of unique task names.
   * Otherwise, the height is calculated using a quadratic formula.
   *
   * @returns {number} The calculated height of the chart.
   */
  const chartHeight = () => {
    if (grouped) {
      const unique = new Set()
      for (const s of series) {
        unique.add(s.name)
      }
      return 80 + unique.size * 15
    } else {
      return 10 + Math.pow(series.length * 2, 2)
    }
  }

  /**
   * Configuration options for the ApexCharts chart.
   * This includes settings for the chart type, theme, plot options, colors, stroke, fill, x-axis, legend, and tooltip.
   */
  const options = {
    area: {
      fillTo: 'end',
    },
    theme: {
      mode: isDark ? 'dark' : 'light',
      monochrome: {
        enabled: true,
      },
    },
    chart: {
      height: 70,
      type: 'rangeBar',
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '70%',
        rangeBarGroupRows: grouped,
        rangeBarOverlap: true,
        isDumbbell: grouped,
        hideZeroBarsWhenGrouped: true,
        borderRadiusWhenStacked: 'last',
      },
    },
    colors: ['#0db7ed'],
    stroke: {
      width: 0,
    },
    fill: {
      type: 'gradient',
    },
    xaxis: {
      type: 'datetime',
      min: new Date() - 24 * 60 * 60 * 1000,
    },
    legend: {
      show: true,
      position: 'right',
    },
    tooltip: {
      custom: function (opts) {
        return (
          'Created:' + new Date(opts.y1) + '<br/>Stopped:' + new Date(opts.y2)
        )
      },
    },
  }

  return (
    <>
      <Card bg={currentVariant} className={currentVariantClasses}>
        <Card.Header>
          <FilterComponent />
        </Card.Header>
        <ReactApexChart
          options={options}
          series={series}
          height={chartHeight()}
          type="rangeBar"
        />
      </Card>
    </>
  )
}

export { TimelineComponent }
