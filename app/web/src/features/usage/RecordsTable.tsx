import type { MonthlyUsage } from '../../shared/api.ts'
import { formatDateTime, formatTokens, formatUsd } from '../../shared/format.ts'

export const RecordsTable = ({ usage }: { usage: MonthlyUsage }) => (
  <section className="panel">
    <h2>Usage records ({usage.items.length})</h2>
    <div className="scroll">
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Project</th>
            <th>Model</th>
            <th className="num">Input</th>
            <th className="num">Cached</th>
            <th className="num">Output</th>
            <th className="num">Cost</th>
          </tr>
        </thead>
        <tbody>
          {usage.items.map((item) => (
            <tr key={item.id}>
              <td>{formatDateTime(item.timestamp)}</td>
              <td>{item.project}</td>
              <td>{item.model}</td>
              <td className="num">{formatTokens(item.inputTokens)}</td>
              <td className="num">{formatTokens(item.cachedInputTokens)}</td>
              <td className="num">{formatTokens(item.outputTokens)}</td>
              <td className="num">{formatUsd(item.cost, 4)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={6}>Total</td>
            <td className="num">{formatUsd(usage.totalCost)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </section>
)
