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

  const series = tasks.map((task) => {
    return {
      name: task.ServiceName + '_' + task.Slot,
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

  const options = {
    theme: {
      mode: isDark ? 'dark' : 'light',
      monochrome: {
        enabled: true,
      },
    },
    chart: {
      height: 80,
      type: 'rangeBar',
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '90%',
        rangeBarGroupRows: true,
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
    },
    legend: {
      show: false,
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
            height={10 + series.length * 20}
            type="rangeBar"
          />
        </Card.Body>
      </Card>
    </>
  )
}

export { TimelineComponent }
