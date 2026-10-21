import type { Breakdown } from '../../shared/api.ts'
import { formatUsd } from '../../shared/format.ts'

export const BreakdownTable = ({ title, rows }: { title: string; rows: Breakdown[] }) => (
  <section className="panel">
    <h2>{title}</h2>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th className="num">Requests</th>
          <th className="num">Cost</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr>
            <td colSpan={3} className="muted">
              No data
            </td>
          </tr>
        )}
        {rows.map((row) => (
          <tr key={row.key}>
            <td>{row.key}</td>
            <td className="num">{row.records}</td>
            <td className="num">{formatUsd(row.cost)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </section>
)
