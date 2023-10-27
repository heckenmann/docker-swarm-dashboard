import { Card } from 'react-bootstrap'
import { useAtomValue } from 'jotai'
import ReactApexChart from 'react-apexcharts'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
  isDarkModeAtom,
  timelineAtom,
} from '../common/store/atoms'

function TimelineComponent() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const isDark = useAtomValue(isDarkModeAtom)

  const tasks = useAtomValue(timelineAtom)
  const grouped = true

  const series = tasks.map((task) => {
    return {
      name: task.ServiceName + ' ' + task.Slot + ' (' + task.ID + ')',
      data: [
        {
          x: task.ServiceName + '_' + task.Slot,
          y: [
            new Date(task.CreatedTimestamp).getTime(),
            task.StoppedTimestamp == ''
              ? new Date().getTime()
              : new Date(task.StoppedTimestamp).getTime(),
          ],
        },
      ],
    }
  })

  let chartHeight = () => {
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
        <Card.Body>
          <ReactApexChart
            options={options}
            series={series}
            height={chartHeight()}
            type="rangeBar"
          />
        </Card.Body>
      </Card>
    </>
  )
}

export { TimelineComponent }
