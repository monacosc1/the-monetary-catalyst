export const formatPublishDate = (dateString: string) => {
  // Create date from the input string
  const date = new Date(dateString);
  
  // Format the date without any timezone conversion
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'  // Use UTC to prevent timezone shifts
  }).format(date);
}; 