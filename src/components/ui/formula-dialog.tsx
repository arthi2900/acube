import { useState } from 'react';
import { Button } from './button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './tooltip';
import { Label } from './label';
import { Textarea } from './textarea';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

/**
 * FormulaDialog Component
 * 
 * A dialog for inserting LaTeX mathematical formulas into the rich text editor.
 * Provides a live preview of the formula as you type.
 * 
 * Common LaTeX syntax examples:
 * - Square root: \sqrt{expression}
 * - Fraction: \frac{numerator}{denominator}
 * - Subscript: x_0 or x_{subscript}
 * - Superscript: x^2 or x^{superscript}
 * - Greek letters: \alpha, \beta, \gamma, \pi, \theta
 * - Sum: \sum_{i=1}^{n}
 * - Integral: \int_{a}^{b}
 */

interface FormulaDialogProps {
  onInsert: (latex: string) => void;
  trigger?: React.ReactNode;
}

const FORMULA_EXAMPLES = [
  {
    label: 'Square Root',
    latex: '\\sqrt{5gR + \\frac{2qER}{m} + \\frac{2W}{m}}',
    description: 'Extended square root over multiple terms',
  },
  {
    label: 'Quadratic Formula',
    latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
    description: 'Standard quadratic formula',
  },
  {
    label: 'Pythagorean Theorem',
    latex: 'a^2 + b^2 = c^2',
    description: 'Simple equation with superscripts',
  },
  {
    label: 'Velocity Formula',
    latex: 'v_0 = \\sqrt{5gR + \\frac{2qER}{m} + \\frac{2W}{m}}',
    description: 'Complex formula with subscripts and fractions',
  },
  {
    label: 'Summation',
    latex: '\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}',
    description: 'Summation notation',
  },
  {
    label: 'Integral',
    latex: '\\int_{a}^{b} f(x)dx',
    description: 'Definite integral',
  },
];

export function FormulaDialog({ onInsert, trigger }: FormulaDialogProps) {
  const [open, setOpen] = useState(false);
  const [latex, setLatex] = useState('');
  const [error, setError] = useState('');

  const handleInsert = () => {
    if (latex.trim()) {
      // Wrap in delimiters for inline math
      onInsert(`$${latex.trim()}$`);
      setLatex('');
      setError('');
      setOpen(false);
    }
  };

  const handleExampleClick = (exampleLatex: string) => {
    setLatex(exampleLatex);
    setError('');
  };

  const renderPreview = () => {
    if (!latex.trim()) {
      return <div className="text-muted-foreground text-sm">Preview will appear here...</div>;
    }

    try {
      return (
        <div className="text-2xl">
          <InlineMath math={latex} />
        </div>
      );
    } catch (err) {
      setError('Invalid LaTeX syntax');
      return <div className="text-destructive text-sm">Invalid LaTeX syntax</div>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            {trigger || (
              <Button type="button" variant="outline" size="sm" className="gap-2">
                <span className="text-lg">∫</span>
                <span className="text-sm">Insert Formula</span>
              </Button>
            )}
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Insert LaTeX formulas with extended square roots, fractions, etc.</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Insert Mathematical Formula</DialogTitle>
          <DialogDescription>
            Enter LaTeX code to create mathematical formulas with proper notation.
            Use examples below or write your own.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* LaTeX Input */}
          <div className="space-y-2">
            <Label htmlFor="latex-input">LaTeX Code</Label>
            <Textarea
              id="latex-input"
              value={latex}
              onChange={(e) => {
                setLatex(e.target.value);
                setError('');
              }}
              placeholder="Enter LaTeX code, e.g., \sqrt{x^2 + y^2}"
              className="font-mono text-sm min-h-[100px]"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="border rounded-lg p-4 bg-muted/50 min-h-[80px] flex items-center justify-center">
              {renderPreview()}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleInsert} disabled={!latex.trim()}>
              Insert Formula
            </Button>
          </div>

          {/* Examples */}
          <div className="space-y-2">
            <Label>Common Examples (Click to use)</Label>
            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto">
              {FORMULA_EXAMPLES.map((example, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleExampleClick(example.latex)}
                  className="text-left p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="font-medium text-sm mb-1">{example.label}</div>
                  <div className="text-xs text-muted-foreground mb-2">{example.description}</div>
                  <div className="flex items-center gap-3">
                    <div className="text-lg">
                      <InlineMath math={example.latex} />
                    </div>
                    <code className="text-xs bg-muted px-2 py-1 rounded flex-1 overflow-x-auto">
                      {example.latex}
                    </code>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Reference */}
          <div className="space-y-2">
            <Label>Quick Reference</Label>
            <div className="text-xs space-y-1 bg-muted/50 p-3 rounded-lg">
              <div><code>\sqrt{'{'}x{'}'}</code> - Square root</div>
              <div><code>\frac{'{'}a{'}'}{'{'} b{'}'}</code> - Fraction a/b</div>
              <div><code>x_0</code> or <code>x_{'{'}sub{'}'}</code> - Subscript</div>
              <div><code>x^2</code> or <code>x^{'{'}sup{'}'}</code> - Superscript</div>
              <div><code>\alpha, \beta, \pi, \theta</code> - Greek letters</div>
              <div><code>\sum, \int, \prod</code> - Operators</div>
              <div><code>\leq, \geq, \neq, \approx</code> - Relations</div>
              <div><code>\times, \div, \pm</code> - Operations</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
