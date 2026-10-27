export interface TextSegment {
  text: string;
  bold: boolean;
}

/**
 * Splits a line into plain and **bold** segments. The result is rendered as
 * React elements, so any HTML in the text (the AI reply is untrusted) is shown
 * literally and never interpreted by the browser.
 */
export function parseBold(line: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const pattern = /\*\*(.*?)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(line)) !== null) {
    if (match.index > last) {
      segments.push({ text: line.slice(last, match.index), bold: false });
    }
    segments.push({ text: match[1], bold: true });
    last = match.index + match[0].length;
  }

  if (last < line.length) {
    segments.push({ text: line.slice(last), bold: false });
  }

  return segments;
}
