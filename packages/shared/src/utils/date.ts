export const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export const formatDateTime = (date: Date): string => {
  return date.toLocaleString("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
