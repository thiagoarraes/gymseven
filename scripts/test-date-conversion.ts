// Test date conversion functions
const formatDateForInput = (date: string | Date | undefined): string => {
  if (!date) return '';
  const d = new Date(date);
  // Use local timezone to avoid date shifting
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDate = (dateStr: string): Date | undefined => {
  if (!dateStr) return undefined;
  // Parse as local date to avoid timezone issues
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatDateForDisplay = (date: string | Date | undefined): string => {
  if (!date) return '';
  try {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
};

// Test the conversion
console.log('🧪 Testando conversão de datas...');

// Test case: 21/02/1982
const testDate = new Date(1982, 1, 21); // Month is 0-indexed
console.log('📅 Data original:', testDate);
console.log('📅 Data original toString:', testDate.toString());

const inputFormat = formatDateForInput(testDate);
console.log('🔄 Formato para input:', inputFormat);

const parsedBack = parseDate(inputFormat);
console.log('🔄 Parsed de volta:', parsedBack);
console.log('🔄 Parsed toString:', parsedBack?.toString());

const displayFormat = formatDateForDisplay(parsedBack);
console.log('📺 Formato para exibição:', displayFormat);

// Test with string date
const stringDate = '1982-02-21';
console.log('\n🧪 Testando com string date:', stringDate);
const parsedString = parseDate(stringDate);
console.log('🔄 Parsed da string:', parsedString);
const displayFromString = formatDateForDisplay(parsedString);
console.log('📺 Display da string:', displayFromString);