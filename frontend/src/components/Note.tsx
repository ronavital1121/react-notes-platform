import { useState } from 'react';
import type { Note as NoteType } from '../contexts/NotesReducer';
import { useNotesDispatch } from '../contexts/NotesContext';
import axios from 'axios';
import { notify } from '../contexts/notify';
import { useUser } from '../contexts/UserContext';

const Note = ({ note }: { note: NoteType }) => {
  const dispatch = useNotesDispatch();
  const { user, token } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(note.content);

 const canEdit = token && user?.email && user.email === note.author?.email;

  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const handleDelete = async () => {
    try {
      notify('Deleting note...', dispatch);
      await axios.delete(`http://localhost:3001/notes/${note._id}`, config);
      dispatch({ type: 'DELETE_NOTE', payload: note._id });
      notify('Note deleted', dispatch);
    } catch (error) {
      console.error('Error deleting note:', error);
      notify('Failed to delete note', dispatch);
    }
  };

  const handleSave = async () => {
  try {
    const response = await axios.put(
      `http://localhost:3001/notes/${note._id}`,
      {
        title: note.title,
        content: editedContent
      },
      config
    );

    const updatedNote = response.data;

    dispatch({ type: 'UPDATE_NOTE', payload: updatedNote });
    notify('Note updated', dispatch);
    setIsEditing(false);
  } catch (error) {
    console.error('Error updating note:', error);
    notify('Failed to update note', dispatch);
  }
};

  const handleCancel = () => {
    setEditedContent(note.content);
    setIsEditing(false);
  };

   return (
    <div className="note" data-testid={note._id}>
      <h2>{note.title}</h2>
      <p>
        Author: {note.author?.name ?? 'Unknown'} (email: {note.author?.email ?? 'N/A'})
      </p>

      {isEditing ? (
        <>
          <textarea
            data-testid={`text_input-${note._id}`}
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            aria-label={`edit_note_${note._id}`}
          />
          <button
            data-testid={`text_input_save-${note._id}`}
            onClick={handleSave}
            disabled={!editedContent.trim() || editedContent === note.content}
            aria-label={`save_note_${note._id}`}
          >
            Save
          </button>
          <button
            data-testid={`text_input_cancel-${note._id}`}
            onClick={handleCancel}
            aria-label={`cancel_edit_note_${note._id}`}
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <p>{note.content}</p>
          {canEdit && (
            <>
              <button
                data-testid={`delete-${note._id}`}
                onClick={handleDelete}
                aria-label={`delete_note_${note._id}`}
              >
                Delete
              </button>
              <button
                data-testid={`edit-${note._id}`}
                onClick={() => setIsEditing(true)}
                aria-label={`edit_note_${note._id}`}
              >
                Edit
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
};
export default Note;
