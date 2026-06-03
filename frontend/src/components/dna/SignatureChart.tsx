import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import type { StockDNA, SignatureChannel } from '../../api'

interface Props {
  dna: StockDNA
}

const CHANNELS = ['Price', 'Volume', 'Range', 'Returns']

const CHANNEL_COLORS: Record<string, string> = {
  Price:   '#3b82f6',
  Volume:  '#f59e0b',
  Range:   '#a855f7',
  Returns: '#22c55e',
  Gap:     '#ef4444',
}

export default function SignatureChart({ dna }: Props) {
  const svgRef     = useRef<SVGSVGElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const draw = () => {
    if (!svgRef.current || !wrapperRef.current) return

    const svg        = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width      = wrapperRef.current.clientWidth
    const rowHeight  = 50
    const marginLeft = 70
    const marginRight = 10
    const paddingTop  = 8

    const channels = dna.channels.filter(c => CHANNELS.includes(c.name))
    const totalHeight = channels.length * rowHeight + paddingTop + 20

    svg.attr('width', width).attr('height', totalHeight)

    const n = dna.dates.length
    const xScale = d3.scaleLinear()
      .domain([0, n - 1])
      .range([marginLeft, width - marginRight])

    channels.forEach((channel: SignatureChannel, i: number) => {
      const y0    = paddingTop + i * rowHeight
      const color = CHANNEL_COLORS[channel.name] ?? '#888'

      svg.append('rect')
        .attr('x', marginLeft)
        .attr('y', y0)
        .attr('width', width - marginLeft - marginRight)
        .attr('height', rowHeight)
        .attr('fill', i % 2 === 0 ? '#18181b' : '#121214')

      const yScale = d3.scaleLinear()
        .domain([0, 1])
        .range([y0 + rowHeight - 4, y0 + 4])

      const area = d3.area<number>()
        .x((_, idx) => xScale(idx))
        .y0(yScale(0))
        .y1(d => yScale(d))
        .curve(d3.curveBasis)

      svg.append('path')
        .datum(channel.values)
        .attr('d', area)
        .attr('fill', color)
        .attr('opacity', 0.15)

      const line = d3.line<number>()
        .x((_, idx) => xScale(idx))
        .y(d => yScale(d))
        .curve(d3.curveBasis)

      svg.append('path')
        .datum(channel.values)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.9)

      svg.append('text')
        .attr('x', marginLeft - 6)
        .attr('y', y0 + rowHeight / 2 + 4)
        .attr('text-anchor', 'end')
        .attr('font-size', 10)
        .attr('fill', color)
        .attr('font-family', 'monospace')
        .text(channel.name)
    })

    // X axis — show dates
    const tickCount = width < 400 ? 3 : 6
    const tickIndices = Array.from({ length: tickCount }, (_, i) =>
      Math.floor(i * (n - 1) / (tickCount - 1))
    )

    const xAxis = d3.axisBottom(xScale)
      .tickValues(tickIndices)
      .tickFormat(i => {
        const date = dna.dates[i as number]
        return date ? date.slice(5) : ''
      })

    svg.append('g')
      .attr('transform', `translate(0, ${totalHeight - 20})`)
      .call(xAxis)
      .call(g => {
        g.select('.domain').attr('stroke', '#3f3f46')
        g.selectAll('.tick line').attr('stroke', '#3f3f46')
        g.selectAll('.tick text')
          .attr('fill', '#71717a')
          .attr('font-size', 9)
      })
  }

  useEffect(() => {
    draw()
    const observer = new ResizeObserver(() => draw())
    if (wrapperRef.current) observer.observe(wrapperRef.current)
    return () => observer.disconnect()
  }, [dna])

  return (
    <div ref={wrapperRef} style={{ width: '100%', overflow: 'hidden' }}>
      <p style={{ color: '#a1a1aa', fontSize: '0.7rem', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
        Price Signature
      </p>
      <svg ref={svgRef} style={{ width: '100%' }} />
    </div>
  )
}