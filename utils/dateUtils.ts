
export const formatDateTime = (dateString: string | Date | undefined): string => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);

    const pad = (n: number) => n.toString().padStart(2, '0');
    
    const dd = pad(date.getDate());
    const mm = pad(date.getMonth() + 1);
    const yyyy = date.getFullYear();
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    const ss = pad(date.getSeconds());

    return `${dd}-${mm}-${yyyy} ${hh}:${mm}:${ss}`;
};
