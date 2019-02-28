import {VenueEntry} from "./VenueEntry";

/**
 * Created by florentcardoen on 22/12/17.
 */
export class ClubEntry{
	public Category: number;
	public CategoryName: string;
	public LongName: string;
	public Name: string;
	public UniqueIndex: string;
	public VenueCount: number;
	public VenueEntries: VenueEntry[];
}
