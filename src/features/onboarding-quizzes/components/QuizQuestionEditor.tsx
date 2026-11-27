import { Plus, Trash2 } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  FormField,
  Input,
  Select,
  Textarea,
} from '@/shared/ui';
import type { QuizQuestionInput, QuizQuestionType } from '../types/quizTypes';

export interface QuizQuestionEditorProps {
  index: number;
  question: QuizQuestionInput;
  disabled?: boolean;
  onChange: (next: QuizQuestionInput) => void;
  onRemove: () => void;
}

export function QuizQuestionEditor({
  index,
  question,
  disabled = false,
  onChange,
  onRemove,
}: QuizQuestionEditorProps) {
  const handleChoiceTextChange = (choiceIdx: number, choiceText: string) => {
    const nextChoices = question.choices.map((c, idx) =>
      idx === choiceIdx ? { ...c, choiceText } : c,
    );
    onChange({ ...question, choices: nextChoices });
  };

  const handleChoiceCorrectChange = (choiceIdx: number, checked: boolean) => {
    const nextChoices = question.choices.map((c, idx) => {
      if (question.questionType === 'singleChoice') {
        return { ...c, isCorrect: idx === choiceIdx ? checked : false };
      }
      return idx === choiceIdx ? { ...c, isCorrect: checked } : c;
    });
    onChange({ ...question, choices: nextChoices });
  };

  const handleAddChoice = () => {
    onChange({
      ...question,
      choices: [...question.choices, { choiceText: '', isCorrect: false }],
    });
  };

  const handleRemoveChoice = (choiceIdx: number) => {
    onChange({
      ...question,
      choices: question.choices.filter((_, idx) => idx !== choiceIdx),
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">Question {index + 1}</CardTitle>
        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`Supprimer la question ${index + 1}`}
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4 text-[var(--danger)]" aria-hidden="true" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <FormField id={`q-text-${index}`} label={`Intitulé de la question ${index + 1} *`}>
              <Input
                id={`q-text-${index}`}
                disabled={disabled}
                value={question.questionText}
                onChange={(e) => onChange({ ...question, questionText: e.target.value })}
              />
            </FormField>
          </div>
          <FormField id={`q-type-${index}`} label="Type de réponse">
            <Select
              id={`q-type-${index}`}
              disabled={disabled}
              value={question.questionType}
              onChange={(e) => {
                const nextType = e.target.value as QuizQuestionType;
                onChange({ ...question, questionType: nextType });
              }}
            >
              <option value="singleChoice">Choix unique</option>
              <option value="multipleChoice">Choix multiple</option>
            </Select>
          </FormField>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              Choix de réponse
            </p>
            {!disabled && (
              <Button type="button" variant="outline" size="sm" onClick={handleAddChoice}>
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Ajouter un choix
              </Button>
            )}
          </div>

          {question.choices.map((choice, cIdx) => (
            <div key={cIdx} className="flex flex-wrap items-center gap-2">
              <Input
                aria-label={`Question ${index + 1} — Choix ${cIdx + 1}`}
                className="flex-1 min-w-[200px]"
                disabled={disabled}
                value={choice.choiceText}
                placeholder={`Réponse ${cIdx + 1}`}
                onChange={(e) => handleChoiceTextChange(cIdx, e.target.value)}
              />
              <Checkbox
                id={`q-${index}-choice-${cIdx}-correct`}
                label="Bonne réponse"
                disabled={disabled}
                checked={choice.isCorrect}
                onChange={(e) => handleChoiceCorrectChange(cIdx, e.target.checked)}
              />
              {!disabled && question.choices.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Supprimer le choix ${cIdx + 1}`}
                  onClick={() => handleRemoveChoice(cIdx)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-[var(--danger)]" aria-hidden="true" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <FormField id={`q-expl-${index}`} label="Explication affichée à la correction (optionnel)">
          <Textarea
            id={`q-expl-${index}`}
            rows={2}
            disabled={disabled}
            value={question.explanation ?? ''}
            onChange={(e) => onChange({ ...question, explanation: e.target.value })}
          />
        </FormField>
      </CardContent>
    </Card>
  );
}
