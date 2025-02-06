import "../styles.css";
import { createRoot } from "react-dom/client";
import { useState, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CharacterCount from "@tiptap/extension-character-count";
import Underline from "@tiptap/extension-underline";
import ListKeymap from "@tiptap/extension-list-keymap";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import EditorMenu from "@/components/composed/EditorMenu";

const extensions = [StarterKit, CharacterCount, ListKeymap, Underline];

const Editor = () => {
	const {syncEntry, loadEntry, entryGoalId } = window.millersAPI;
	const editor = useEditor({
		extensions,
		content: "",
		autofocus: "end",
		editorProps: {
			attributes: {
				class: "outline-none"
			}
		}
	});
	const [wordCount, setWordCount] = useState<number>(0);
	const [pendingSave, updateSavePending] = useState<boolean>(false);
	const [goalID, setGoalID] = useState<number | null>(null)
	const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);
	const today = format(new Date(), "yyyy-MM-dd");

	const autoSaveEntry = () => {
		if (autoSaveTimeout.current) {
			clearTimeout(autoSaveTimeout.current);
		}

		autoSaveTimeout.current = setTimeout(async () => {
			const synResult = await syncEntry({
				created_date: today,
				content_html: editor.getHTML(),
				content_text: editor.getText(),
				word_count: editor.storage.characterCount.words(),
				goal_id: goalID,
			});

			if (synResult.syncSuccess) {
				updateSavePending(false);
			} else {
				updateSavePending(true);
			}
		}, 600);
	};

	editor.on("create", async ({ editor }) => {
		const existingEntry = await loadEntry({
			date_key: today,
		});

		const getGoalID = await entryGoalId({today})

		if (getGoalID.result){
			setGoalID(getGoalID.result.id)
		}

		if (existingEntry.result) {
			const { content_html } = existingEntry.result as Entry;
			editor.commands.setContent(content_html);
			const initialWordCount = editor.storage.characterCount.words();
			setWordCount(initialWordCount);
		}
	});

	editor.on("update", ({ editor }) => {
		setWordCount(editor.storage.characterCount.words());
		autoSaveEntry();
	});

	return (
		<div className="relative flex flex-col h-full w-full items-start px-4 pt-4">
			<div className="flex flex-row w-full h-10 items-center justify-between mb-2">
				<EditorMenu editor={editor} />
				<p className="text-sm font-bold">{wordCount} words</p>
				<div>
					<p className="text-sm">{pendingSave && "Unsaved changes"}</p>
					<Button variant="link" className="text-red-500" onClick={() => window.close()}>
						{" "}
						Exit Editor
					</Button>
				</div>
			</div>
			<div id="" className="flex w-full flex-grow">
			<EditorContent id="editor" editor={editor} />
			</div>
		</div>
	);
};

const root = createRoot(document.getElementById("root"));
root.render(<Editor />);
