import { useContext, useEffect, useCallback } from "react";
import { AppContext } from "../../context/AppContext";
import { SocketContext } from "../../context/SocketContext";
import useWindowDimensions from "../../hooks/useWindowDimensions";
import { Tldraw, useEditor } from "tldraw";

function DrawingEditor() {
  const { isMobile } = useWindowDimensions();

  return (
    <Tldraw inferDarkMode forceMobile={isMobile} defaultName="Editor" className="z-0">
      <ReachEditor />
    </Tldraw>
  );
}

function ReachEditor() {
  const editor = useEditor();
  const { drawingData, setDrawingData } = useContext(AppContext);
  const { socket } = useContext(SocketContext);

  const handleChangeEvent = useCallback(
    (change) => {
      const snapshot = change.changes;
      setDrawingData(editor.store.getSnapshot());
      socket.emit("drawing-update", { snapshot });
    },
    [editor.store, setDrawingData, socket]
  );

  const handleRemoteDrawing = useCallback(
    ({ snapshot }) => {
      editor.store.mergeRemoteChanges(() => {
        const { added, updated, removed } = snapshot;

        for (const record of Object.values(added)) {
          editor.store.put([record]);
        }
        for (const [, to] of Object.values(updated)) {
          editor.store.put([to]);
        }
        for (const record of Object.values(removed)) {
          editor.store.remove([record.id]);
        }
      });

      setDrawingData(editor.store.getSnapshot());
    },
    [editor.store, setDrawingData]
  );

  useEffect(() => {
    if (drawingData && Object.keys(drawingData).length > 0) {
      editor.store.loadSnapshot(drawingData);
    }
  }, [drawingData, editor.store]);

  useEffect(() => {
    const cleanupFunction = editor.store.listen(handleChangeEvent, {
      source: "user",
      scope: "document",
    });
    socket.on("drawing-update", handleRemoteDrawing);

    return () => {
      cleanupFunction();
      socket.off("drawing-update");
    };
  }, [drawingData, editor.store, handleChangeEvent, handleRemoteDrawing, socket]);

  return null;
}

export default DrawingEditor;