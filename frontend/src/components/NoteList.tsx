import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNotesState, useNotesDispatch } from '../contexts/NotesContext';
import { useUser } from '../contexts/UserContext';
import { notify } from '../contexts/notify';
import type { Note as NoteType } from '../contexts/NotesReducer';
import Note from './Note';
import Pagination from './Pagination';

const POSTS_PER_PAGE = 10;

const NoteList = () => {
  const { notes, activePage, totalPages } = useNotesState();
  const dispatch = useNotesDispatch();
  const { user, token } = useUser();

  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [notesCache, setNotesCache] = useState<{ [page: number]: NoteType[] }>({});

  const totalCountRef = useRef<number>(0);

  const fetchAndCacheNotes = async (centerPage: number) => {
    const start = Math.max(1, centerPage - 2);
    const visiblePages = Array.from({ length: 5 }, (_, i) => start + i).filter(
      (page) => page <= totalPages
    );

    const pagesToFetch = visiblePages.filter((page) => !notesCache[page]);

    if (pagesToFetch.length === 0) {
      dispatch({
        type: 'SET_NOTES',
        payload: {
          notes: notesCache[centerPage] ?? [],
          total: totalCountRef.current || notes.length * totalPages,
        },
      });
      return;
    }

    try {
      const responses = await Promise.all(
        pagesToFetch.map((page) =>
          axios
            .get('http://localhost:3001/notes', {
              params: { _page: page, _limit: POSTS_PER_PAGE },
              headers: { Accept: 'application/json' },
            })
            .then((res) => ({
              page,
              data: res.data,
              total: res.headers['x-total-count'],
            }))
        )
      );

      const updatedCache = { ...notesCache };
      responses.forEach(({ page, data, total: totalStr }) => {
        updatedCache[page] = data.map((note: any) => ({
          ...note,
          author: note.author,
        }));
        if (totalStr) {
          totalCountRef.current = parseInt(totalStr, 10);
        }
      });

      const newCache: typeof updatedCache = {};
      visiblePages.forEach((page) => {
        if (updatedCache[page]) newCache[page] = updatedCache[page];
      });

      setNotesCache(newCache);

      dispatch({
        type: 'SET_NOTES',
        payload: {
          notes: newCache[centerPage] ?? [],
          total: totalCountRef.current,
        },
      });
    } catch (error) {
      console.error('Fetch error:', error);
      notify('Failed to load notes', dispatch);
    }
  };

  useEffect(() => {
    fetchAndCacheNotes(activePage);
  }, [activePage]);

  const handleAddNote = async () => {
    if (!user || !token) {
      notify('You must be logged in to add a note', dispatch);
      return;
    }

    const newNote = {
      title: 'New Note',
      content: newNoteContent,
      user: {
        name: user.name,
        email: user.email,
      },
    };

    try {
      const response = await axios.post('http://localhost:3001/notes', newNote, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const savedNote = response.data;
      const normalizedNote = {
        ...savedNote,
        author: savedNote.author,
      };

      setNotesCache((prevCache) => {
        const page1 = prevCache[1] ?? [];
        const newPage1 = [normalizedNote, ...page1.slice(0, POSTS_PER_PAGE - 1)];

        dispatch({
          type: 'SET_NOTES',
          payload: {
            notes: newPage1,
            total: totalCountRef.current + 1,
          },
        });

        return {
          ...prevCache,
          1: newPage1,
        };
      });

      totalCountRef.current += 1;
      dispatch({ type: 'SET_ACTIVE_PAGE', payload: 1 });

      notify('Added a new note', dispatch);
      setNewNoteContent('');
      setIsAdding(false);
    } catch (error) {
      console.error('Add note error:', error);
      notify('Failed to add note', dispatch);
    }
  };

  return (
    <div>
      {/* Add Note Section */}
      {user ? (
        isAdding ? (
          <div>
            <input
              type="text"
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              aria-label="text_input_new_note"
              data-testid="text_input_new_note"
            />
            <button
              aria-label="text_input_save_new_note"
              data-testid="text_input_save_new_note"
              onClick={handleAddNote}
              disabled={!newNoteContent.trim()}
            >
              Save
            </button>
            <button
              aria-label="text_input_cancel_new_note"
              data-testid="text_input_cancel_new_note"
              onClick={() => setIsAdding(false)}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            aria-label="Add New Note"
            data-testid="add_new_note"
            onClick={() => setIsAdding(true)}
          >
            Add New Note
          </button>
        )
      ) : (
        <p>Please login to add a note.</p>
      )}

      {/* Notes Display */}
      {notes.length === 0 ? (
        <p>No notes found.</p>
      ) : (
        notes.map((note) => <Note key={note._id } note={note} />)
      )}

      {/* Pagination Bar */}
      <Pagination
        currentPage={activePage}
        totalPages={totalPages}
        onPageChange={(page) =>
          dispatch({ type: 'SET_ACTIVE_PAGE', payload: page })
        }
      />
    </div>
  );
};

export default NoteList;
