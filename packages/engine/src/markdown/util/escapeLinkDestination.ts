export const escapeLinkDestination = (destination: string) => {
  const escaped = destination.replace(/([<>()])/g, "\\$1")

  return escaped.includes(" ") ? `<${escaped}>` : escaped
}
