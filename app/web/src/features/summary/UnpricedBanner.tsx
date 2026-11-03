export const UnpricedBanner = ({ count }: { count: number }) => {
  if (count === 0) return null

  return (
    <div className="banner banner-warning" role="alert">
      {count === 1
        ? '1 record has no price and is not included in the totals.'
        : `${count} records have no price and are not included in the totals.`}
    </div>
  )
}
