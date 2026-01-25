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

  const series = (tasks || [])
    .filter((task) =>
      serviceNameFilter
        ? (task.ServiceName || '').includes(serviceNameFilter)
        : true,
    )
    .filter((task) =>
      stackNameFilter ? (task.Stack || '').includes(stackNameFilter) : true,
    )
    .map((task) => {
      // normalize timestamp fields (mock data sometimes has typos)
      const createdRaw =
        task.CreatedTimestamp ||
        task.createdTimestamp ||
        task.CreatedAt ||
        task.Timestamp ||
        ''
      const stoppedRaw = task.StoppedTimestamp || task.stoppedTimestamp || ''

      const createdTime = createdRaw ? new Date(createdRaw).getTime() : NaN
      const stoppedTime =
        stoppedRaw === ''
          ? new Date().getTime()
          : new Date(stoppedRaw).getTime()

      // ensure service name is always a string to avoid downstream toLowerCase errors
      const svcName = task.ServiceName != null ? String(task.ServiceName) : ''

      // skip invalid/unnamed entries
      if (isNaN(createdTime) || svcName === '') return null

      return {
        name: svcName + ' ' + (task.Slot || '') + ' (' + (task.ID || '') + ')',
        data: [
          {
            x: svcName + '_' + (task.Slot || ''),
            y: [createdTime, stoppedTime],
          },
        ],
      }
    })
    .filter((s) => s)

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

  // sanitize series: ensure names are strings and data contains numeric timestamps
  const sanitizeSeries = (rawSeries) => {
    if (!Array.isArray(rawSeries)) return []
    const out = []
    for (const s of rawSeries) {
      try {
        if (!s || typeof s !== 'object') continue
        const name = s.name != null ? String(s.name) : ''
        if (name.trim() === '') continue
        if (!Array.isArray(s.data) || s.data.length === 0) continue
        const item = s.data[0]
        const x = item && item.x != null ? String(item.x) : ''
        const y =
          item && Array.isArray(item.y) ? item.y.map((v) => Number(v)) : null
        if (!x || !y || y.length !== 2 || y.some((n) => Number.isNaN(n)))
          continue
        out.push({ name, data: [{ x, y }] })
      } catch (err) {
        // ignore malformed series entries

        console.error('Malformed timeline series entry skipped', err)
      }
    }
    return out
  }

  const sanitizedSeries = sanitizeSeries(series)

  // validate options to avoid apexcharts internal errors (like calling toLowerCase on undefined)
  const validateOptions = (opts) => {
    try {
      if (!opts || typeof opts !== 'object')
        return { ok: false, msg: 'options missing' }
      // chart.type must be a string
      if (!opts.chart || typeof opts.chart.type !== 'string')
        return { ok: false, msg: 'chart.type missing or not string' }
      // theme.mode should be 'dark'|'light'
      if (!opts.theme || typeof opts.theme.mode !== 'string')
        return { ok: false, msg: 'theme.mode missing or not string' }
      // colors should be array of strings
      if (
        opts.colors &&
        (!Array.isArray(opts.colors) ||
          opts.colors.some((c) => typeof c !== 'string'))
      )
        return { ok: false, msg: 'colors must be array of strings' }
      return { ok: true }
    } catch (err) {
      return { ok: false, msg: String(err) }
    }
  }

  const optionsValidation = validateOptions(options)

  return (
    <>
      <Card bg={currentVariant} className={currentVariantClasses}>
        <Card.Header>
          <FilterComponent />
        </Card.Header>
        {optionsValidation.ok ? (
          sanitizedSeries.length ? (
            <ReactApexChart
              options={options}
              series={sanitizedSeries}
              height={chartHeight()}
              type="rangeBar"
            />
          ) : (
            <div style={{ padding: '1rem' }}>No timeline data available</div>
          )
        ) : (
          <div style={{ padding: '1rem', color: 'var(--muted)' }}>
            Timeline cannot be rendered: {optionsValidation.msg}
            {/* log full options for debugging in dev console */}
            {console.error(
              'Timeline options validation failed:',
              options,
              optionsValidation,
            )}
          </div>
        )}
      </Card>
    </>
  )
}

export { TimelineComponent }
