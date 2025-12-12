import { ArrowUpRight } from "lucide-react";

const starterQuestions = [
  "explain quantum computing simply",
  "what are the latest AI developments?",
  "compare React vs Vue.js",
  "summarize the history of the internet",
];

export const StarterQuestionsList = ({
  handleSend,
}: {
  handleSend: (question: string) => void;
}) => {
  return (
    <ul className="flex flex-col space-y-1 pt-2">
      {starterQuestions.map((question) => (
        <li key={question} className="flex items-center space-x-2">
          <ArrowUpRight size={18} className="text-tint shrink-0" />
          <button
            onClick={() => handleSend(question)}
            className="font-medium text-left break-words normal-case
              hover:text-tint transition-colors duration-200
              focus:outline-none focus-visible:underline focus-visible:text-tint"
          >
            {question}
          </button>
        </li>
      ))}
    </ul>
  );
};

