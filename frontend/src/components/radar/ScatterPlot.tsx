import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import type { EmbeddingPoint } from '../../api'

interface Props {
  points: EmbeddingPoint[]
}

export default function ScatterPlot({ points }: Props) {
  const svgRef     = useRef<SVGSVGElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<EmbeddingPoint | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  const draw = () => {
    if (!svgRef.current || !wrapperRef.current || !points.length) return

    const svg    = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width  = wrapperRef.current.clientWidth
    const height = Math.min(320, width * 0.7)
    const margin = { top: 20, right: 20, bottom: 40, left: 40 }

    svg.attr('width', width).attr('height', height)

    const xScale = d3.scaleLinear()
      .domain(d3.extent(points, p => p.x) as [number, number])
      .range([margin.left, width - margin.right])
      .nice()

    const yScale = d3.scaleLinear()
      .domain(d3.extent(points, p => p.y) as [number, number])
      .range([height - margin.bottom, margin.top])
      .nice()

    // Grid
    svg.append('g')
      .selectAll('line')
      .data(yScale.ticks(4))
      .join('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', '#27272a')
      .attr('stroke-width', 1)

    svg.append('g')
      .selectAll('line')
      .data(xScale.ticks(4))
      .join('line')
      .attr('x1', d => xScale(d))
      .attr('x2', d => xScale(d))
      .attr('y1', margin.top)
      .attr('y2', height - margin.bottom)
      .attr('stroke', '#27272a')
      .attr('stroke-width', 1)

    // Axes
    svg.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).ticks(4).tickSize(0))
      .call(g => {
        g.select('.domain').attr('stroke', '#3f3f46')
        g.selectAll('.tick text').attr('fill', '#52525b').attr('font-size', 9)
      })

    svg.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale).ticks(4).tickSize(0))
      .call(g => {
        g.select('.domain').attr('stroke', '#3f3f46')
        g.selectAll('.tick text').attr('fill', '#52525b').attr('font-size', 9)
      })

    // Dots
    const dotRadius = width < 400 ? 8 : 10

    svg.append('g')
      .selectAll('circle')
      .data(points)
      .join('circle')
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('r', dotRadius)
      .attr('fill', d => d.sector_color)
      .attr('fill-opacity', 0.85)
      .attr('stroke', '#18181b')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        const rect = wrapperRef.current!.getBoundingClientRect()
        setTooltip(d)
        setTooltipPos({ x: event.clientX - rect.left + 12, y: event.clientY - rect.top - 12 })
      })
      .on('mouseout', () => setTooltip(null))

    // Labels
    svg.append('g')
      .selectAll('text')
      .data(points)
      .join('text')
      .attr('x', d => xScale(d.x))
      .attr('y', d => yScale(d.y) + 4)
      .attr('text-anchor', 'middle')
      .attr('font-size', width < 400 ? 6 : 7)
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .attr('fill', '#ffffff')
      .attr('pointer-events', 'none')
      .text(d => d.symbol)
  }

  useEffect(() => {
    draw()
    const observer = new ResizeObserver(() => draw())
    if (wrapperRef.current) observer.observe(wrapperRef.current)
    return () => observer.disconnect()
  }, [points])

  return (
    <div ref={wrapperRef} style={{ width: '100%', position: 'relative' }}>
      <p style={{ color: '#a1a1aa', fontSize: '0.7rem', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
        Behaviour Scatter
      </p>
      <p style={{ color: '#52525b', fontSize: '0.7rem', marginBottom: '0.75rem' }}>
        Stocks close together behave similarly. Hover for details.
      </p>
      <div style={{ position: 'relative' }}>
        <svg ref={svgRef} style={{ width: '100%' }} />
        {tooltip && (
          <div style={{
            position: 'absolute',
            pointerEvents: 'none',
            background: '#27272a',
            border: '1px solid #3f3f46',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            fontSize: '0.75rem',
            zIndex: 10,
            minWidth: '10rem',
            left: tooltipPos.x,
            top: tooltipPos.y,
          }}>
            <p style={{ fontWeight: 900, color: tooltip.sector_color, marginBottom: '0.25rem' }}>{tooltip.symbol}</p>
            <p style={{ color: '#a1a1aa', marginBottom: '0.25rem' }}>{tooltip.name}</p>
            <p style={{ color: '#71717a', marginBottom: '0.5rem' }}>{tooltip.sector}</p>
            <p style={{ fontFamily: 'monospace', color: tooltip.price_change_1y >= 0 ? '#22c55e' : '#ef4444' }}>
              {tooltip.price_change_1y >= 0 ? '+' : ''}{tooltip.price_change_1y.toFixed(1)}% 1Y
            </p>
          </div>
        )}
      </div>
    </div>
  )
}