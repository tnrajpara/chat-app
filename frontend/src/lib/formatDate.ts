export function getHoursMinutes(timestamp: number) {
  const date = new Date(timestamp * 1000);

  let hours = date.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours.toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")} ${ampm}`;
}
