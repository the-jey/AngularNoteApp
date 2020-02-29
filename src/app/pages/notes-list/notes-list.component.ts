import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Note } from 'src/app/shared/note.model';
import { NotesService } from 'src/app/shared/notes.service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-notes-list',
  templateUrl: './notes-list.component.html',
  styleUrls: ['./notes-list.component.scss'],
  animations: [
    trigger('itemAnim', [
      // ENTRY ANIMATION
      transition('void => *', [
        // Initial State
        style({
          height: 0,
          opacity: 0,
          transform: 'scale(0.85)',
          'margin-bottom': 0,

          //We have to 'expand' out the padding properties
          paddingTop: 0,
          paddingBottom: 0,
          paddingLeft: 0,
          paddingRight: 0
        }),
        //We first want to animate the spacing
        animate('50ms', style({
          height: '*',
          'margin-bottom': '*',
          paddingTop: '*',
          paddingBottom: '*',
          paddingLeft: '*',
          paddingRight: '*'
        })),
        animate(100)
      ]),

      transition('* => void', [
        // first scale up
        animate(50, style({
          transform: 'scale(1.05)'
        })),
        //next scale down back to normal size
        animate(50, style({
          transform: 'scale(1)',
          opacity: 0.75
        })),
        //scale down and fade up completly
        animate('120ms ease-out', style({
          transform: 'scale(0.5)',
          opacity: 0,
        })),
        // then animate the spacing
        animate('150ms ease-out', style({
          height: 0,
          paddingTop: 0,
          paddingBottom: 0,
          paddingLeft: 0,
          paddingRight: 0,
          'margin-bottom': 0
        }))
      ])
    ]),

    trigger('listAnim', [
      transition('* => *', [
        query(':enter', [
          style({
            opacity: 0,
            height: 0
          }),
          stagger(100, [
            animate('0.2s ease')
          ])
        ], {
          optional: true
        })
      ])
    ])

  ]
})
export class NotesListComponent implements OnInit {

  notes: Note[] = new Array<Note>();

  filteredNotes: Note[] = new Array<Note>();

  @ViewChild('filterInput', {static: false}) filterInputElRef: ElementRef<HTMLInputElement>;

  constructor(private notesService: NotesService) { }

  ngOnInit() {
    //We want to retrieve all notes from NoteService
    this.notes = this.notesService.getAll();
    this.filteredNotes = this.notesService.getAll();
  }

  deleteNote(note: Note) {
    let noteId = this.notesService.getId(note);
    this.notesService.delete(noteId);
    this.filter(this.filterInputElRef.nativeElement.value);
  }

  generateNoteURL(note: Note) {
    let noteId = this.notesService.getId(note);
    return noteId;
  }

  filter(query: string) {
    query = query.toLowerCase().trim();

    let allResults: Note[] = new Array<Note>();
    // split uo the search query into inviduals words
    let terms: string[] = query.split(' '); // split on spaces
    // remove duplicate search terms
    terms = this.removeDuplicates(terms);
    //compile all relevant results into the AllResults array
    terms.forEach(term => {
      let results = this.relevantNotes(term);
      //append results to the allResults array
      allResults = [...allResults, ...results];
    });

    //allResults will include duplicate notes
    //because a particular note can be the result of many search terms
    // but we don't show that on the UI
    // so we first must remove duplicates
    let uniqueResults = this.removeDuplicates(allResults);
    this.filteredNotes = uniqueResults;

    //now sort by revelancy
    this.sortByRevelancy(allResults);
  }

  removeDuplicates(arr: Array<any>) : Array<any> {
    let uniqueResults: Set<any> = new Set<any>();
    // loop the array
    arr.forEach(e => uniqueResults.add(e));

    return Array.from(uniqueResults);
  }

  relevantNotes(query: string) :Array<Note>{
    query = query.toLowerCase().trim();
    let relevantNotes  = this.notes.filter(note => {
      if (note.title && note.title.toLowerCase().includes(query)) {
        return true;
      }if (note.body && note.body.toLowerCase().includes(query)) {
        return true;
      }
      return false;
    })

    return relevantNotes;

  }

  sortByRevelancy(searchResults: Note[]) {
    let noteCountObj: Object = {};

    searchResults.forEach(note => {
      let noteId = this.notesService.getId(note);

      if(noteCountObj[noteId]) {
        noteCountObj[noteId] += 1;
      } else {
        noteCountObj[noteId] = 1;
      }
    });

    this.filteredNotes = this.filteredNotes.sort((a: Note, b: Note) => {
      let aId = this.notesService.getId(a);
      let bId = this.notesService.getId(b);

      let aCount = noteCountObj[aId];
      let bCount = noteCountObj[bId];

      return bCount - aCount;
    })

  }

}
