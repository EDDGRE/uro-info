import { Fragment } from "react";
import type { CompetencyItem } from "@uro-info/content";

export function CompetencyTable({ items }: { items: CompetencyItem[] }) {
  if (!items.length) return null;

  return (
    <div className="callout low">
      <b>Kompetanseportalen — krav til antall (LIS-utdanning)</b>
      <div className="table-scroll">
        <table className="datatable" style={{ margin: "6px 0 0" }}>
          <tbody>
            {items.map((item) => (
              <Fragment key={item.label}>
                <tr>
                  <td>{item.label}</td>
                  <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>
                    {item.count}
                  </td>
                </tr>
                {item.note && (
                  <tr>
                    <td
                      colSpan={2}
                      style={{ fontSize: "11.5px", color: "var(--ink-soft)", paddingTop: 0 }}
                    >
                      {item.note}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
