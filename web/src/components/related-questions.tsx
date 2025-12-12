import { PlusIcon } from "lucide-react";

export default function RelatedQuestions({
  questions,
  onSelect,
}: {
  questions: string[];
  onSelect: (question: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1 mt-2">
      {questions.map((question, index) => (
        <button
          key={`question-${index}`}
          className="flex cursor-pointer items-center py-2.5 px-3 font-medium justify-between 
            rounded-lg transition-all duration-200 text-left
            hover:bg-muted/50 hover:translate-x-1
            focus:outline-none focus-visible:ring-2 focus-visible:ring-tint focus-visible:ring-offset-2 focus-visible:ring-offset-background
            group"
          onClick={() => onSelect(question)}
          aria-label={`Ask: ${question}`}
        >
          <span className="text-foreground/90 group-hover:text-foreground transition-colors">
            {question.toLowerCase()}
          </span>
          <PlusIcon className="text-tint shrink-0 ml-2 transition-transform group-hover:rotate-90 duration-200" size={18} />
        </button>
      ))}
    </div>
  );
}
