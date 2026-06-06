import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import type { StockDNA } from '../../api'

interface Props {
  dna: StockDNA
}

export default function PriceChart({ dna }: Props) {
  const svgRef     = useRef<SVGSVGElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const draw = () => {
    if (!svgRef.current || !wrapperRef.current) return

    const svg    = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width  = wrapperRef.current.clientWidth
    const height = 140
    const margin = { top: 10, right: 10, bottom: 24, left: 50 }

    svg.attr('width', width).attr('height', height)

    // Get price channel and denormalise
    const priceCh = dna.channels.find(c => c.name === 'Price')
    if (!priceCh) return

    const rawPrices = priceCh.values.map(
      v => v * (priceCh.raw_max - priceCh.raw_min) + priceCh.raw_min
    )
    const n = rawPrices.length

    const xScale = d3.scaleLinear()
      .domain([0, n - 1])
      .range([margin.left, width - margin.right])

    const yScale = d3.scaleLinear()
      .domain([d3.min(rawPrices) as number * 0.98, d3.max(rawPrices) as number * 1.02])
      .range([height - margin.bottom, margin.top])

    // Grid lines
    svg.append('g')
      .selectAll('line')
      .data(yScale.ticks(4))
      .join('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', '#27272a')
      .attr('stroke-width', 0.5)

    // Area fill
    const isPositive = rawPrices[rawPrices.length - 1] >= rawPrices[0]
    const color = isPositive ? '#22c55e' : '#ef4444'

    const area = d3.area<number>()
      .x((_, i) => xScale(i))
      .y0(height - margin.bottom)
      .y1(d => yScale(d))
      .curve(d3.curveBasis)

    svg.append('path')
      .datum(rawPrices)
      .attr('d', area)
      .attr('fill', color)
      .attr('opacity', 0.1)

    // Price line
    const line = d3.line<number>()
      .x((_, i) => xScale(i))
      .y(d => yScale(d))
      .curve(d3.curveBasis)

    svg.append('path')
      .datum(rawPrices)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2)

    // Y axis
    svg.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale).ticks(4).tickFormat(d => `₹${(+d).toFixed(0)}`))
      .call(g => {
        g.select('.domain').remove()
        g.selectAll('.tick line').remove()
        g.selectAll('.tick text').attr('fill', '#71717a').attr('font-size', 9)
      })

    // X axis — dates
    const tickCount = width < 400 ? 3 : 5
    const tickIndices = Array.from({ length: tickCount }, (_, i) =>
      Math.floor(i * (n - 1) / (tickCount - 1))
    )

    svg.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(xScale)
        .tickValues(tickIndices)
        .tickFormat(i => dna.dates[i as number]?.slice(0, 7) ?? '')
      )
      .call(g => {
        g.select('.domain').attr('stroke', '#3f3f46')
        g.selectAll('.tick line').remove()
        g.selectAll('.tick text').attr('fill', '#71717a').attr('font-size', 9)
      })

    // Current price dot
    const lastX = xScale(n - 1)
    const lastY = yScale(rawPrices[n - 1])

    svg.append('circle')
      .attr('cx', lastX)
      .attr('cy', lastY)
      .attr('r', 4)
      .attr('fill', color)

    svg.append('text')
      .attr('x', lastX - 4)
      .attr('y', lastY - 8)
      .attr('text-anchor', 'end')
      .attr('font-size', 9)
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .attr('fill', color)
      .text(`₹${rawPrices[n - 1].toFixed(0)}`)
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
        Price History — {dna.period}
      </p>
      <svg ref={svgRef} style={{ width: '100%' }} />
    </div>
  )
}