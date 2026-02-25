import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * MathRenderer Component
 * 
 * Renders HTML content with LaTeX formulas converted to beautiful mathematical notation.
 * Automatically detects and renders formulas wrapped in $ delimiters.
 * 
 * Usage:
 * ```tsx
 * <MathRenderer content={question.question_text} />
 * ```
 * 
 * The content can include:
 * - Regular HTML formatting
 * - Inline LaTeX formulas: $\sqrt{x^2 + y^2}$
 * - Display LaTeX formulas: $$\int_{a}^{b} f(x)dx$$
 */

interface MathRendererProps {
  content: string;
  className?: string;
  onClick?: () => void;
}

export function MathRenderer({ content, className = '', onClick }: MathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !content) return;

    // First, set the HTML content
    containerRef.current.innerHTML = content;

    // Get all text content including from nested elements
    const getAllTextNodes = (node: Node): Text[] => {
      const textNodes: Text[] = [];
      
      if (node.nodeType === Node.TEXT_NODE) {
        textNodes.push(node as Text);
      } else {
        node.childNodes.forEach(child => {
          textNodes.push(...getAllTextNodes(child));
        });
      }
      
      return textNodes;
    };

    // Process each text node
    const textNodes = getAllTextNodes(containerRef.current);
    
    textNodes.forEach(textNode => {
      const text = textNode.textContent || '';
      
      // Check if this text node contains a formula
      const inlineMathRegex = /\$([^$]+)\$/g;
      
      if (!inlineMathRegex.test(text)) return;
      
      // Reset regex
      inlineMathRegex.lastIndex = 0;
      
      // Create a container for the new content
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      let match;
      
      while ((match = inlineMathRegex.exec(text)) !== null) {
        // Add text before the formula
        if (match.index > lastIndex) {
          fragment.appendChild(
            document.createTextNode(text.substring(lastIndex, match.index))
          );
        }
        
        // Render the formula
        const formulaSpan = document.createElement('span');
        formulaSpan.className = 'math-formula';
        
        try {
          katex.render(match[1], formulaSpan, {
            throwOnError: false,
            displayMode: false,
          });
        } catch (error) {
          // If rendering fails, show the original text
          formulaSpan.textContent = match[0];
          formulaSpan.className = 'math-formula-error text-destructive';
          console.error('KaTeX rendering error:', error, 'Formula:', match[1]);
        }
        
        fragment.appendChild(formulaSpan);
        lastIndex = match.index + match[0].length;
      }
      
      // Add remaining text
      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
      }
      
      // Replace the text node with the fragment
      textNode.parentNode?.replaceChild(fragment, textNode);
    });
  }, [content]);

  return (
    <div
      ref={containerRef}
      className={`math-content ${className}`}
      onClick={onClick}
      style={{
        // Ensure proper spacing for math elements
        lineHeight: '1.8',
      }}
    />
  );
}
