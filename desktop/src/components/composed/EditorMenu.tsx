import { Bold, Italic, Underline } from "lucide-react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Editor } from "@tiptap/react";

const EditorMenu = ({editor} : {editor: Editor}) => {
	return (
		<ToggleGroup type="multiple">
			<ToggleGroupItem value="bold" aria-label="Toggle bold" onClick={() => editor.commands.toggleBold()}>
				<Bold className="h-4 w-4" />
			</ToggleGroupItem>
			<ToggleGroupItem value="italic" aria-label="Toggle italic" onClick={() => editor.commands.toggleItalic()}>
				<Italic className="h-4 w-4" />
			</ToggleGroupItem>
			<ToggleGroupItem value="underline" aria-label="Toggle underline" onClick={() => editor.commands.toggleUnderline()}>
				<Underline className="h-4 w-4" />
			</ToggleGroupItem>
		</ToggleGroup>
	);
};

export default EditorMenu;
