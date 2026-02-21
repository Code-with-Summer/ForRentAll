import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";

const amenityOptions = ["", "Parking", "Electricity", "Maintenance", "Water", "Internet", "Other"];

const AmenityRow = ({ label, value, onChange, expense, onExpenseChange }) => (
	<div style={{display:'grid', gridTemplateColumns:'1fr 120px', gap:'0.75rem', marginBottom:'0.75rem'}}>
		<select value={value} onChange={e => onChange(e.target.value)}>
			{amenityOptions.map(opt => (
				<option key={opt} value={opt}>{opt || `Select ${label}`}</option>
			))}
		</select>
		<input 
			type="number" 
			value={expense} 
			onChange={e => {
				const v = e.target.value;
				if (String(v) !== String(expense)) onExpenseChange(v);
			}} 
			placeholder="Cost"
			disabled={!value}
			autoComplete="off"
			style={{ imeMode: 'auto' }}
		/>
	</div>
);

export default function CreateUnit(){
	const { id } = useParams();
	const [number, setNumber] = useState("");
	const [rent, setRent] = useState("");
	const [amenity1, setAmenity1] = useState("");
	const [amenity1Expense, setAmenity1Expense] = useState("");
	const [amenity2, setAmenity2] = useState("");
	const [amenity2Expense, setAmenity2Expense] = useState("");
	const [amenity3, setAmenity3] = useState("");
	const [amenity3Expense, setAmenity3Expense] = useState("");
	const [amenity4, setAmenity4] = useState("");
	const [amenity4Expense, setAmenity4Expense] = useState("");
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(false);
	const nav = useNavigate();

	const submit = async (e) => {
		e.preventDefault();
		try {
			setError(null);
			setLoading(true);
			// Combine all photos
			const allPhotos = [...photos, ...extraPhotos];
			// Prepare FormData for file upload
			const formData = new FormData();
			formData.append("number", number);
			formData.append("rent", rent);
			formData.append("property", id);
			formData.append("amenity1", amenity1);
			formData.append("amenity1Expense", amenity1Expense);
			formData.append("amenity2", amenity2);
			formData.append("amenity2Expense", amenity2Expense);
			formData.append("amenity3", amenity3);
			formData.append("amenity3Expense", amenity3Expense);
			formData.append("amenity4", amenity4);
			formData.append("amenity4Expense", amenity4Expense);
			formData.append("rooms", rooms);
			formData.append("halls", halls);
			formData.append("bathrooms", bathrooms);
			formData.append("balcony", balcony);
			formData.append("mapLink", mapLink);
			formData.append("description", description);
			allPhotos.forEach((file, idx) => {
				formData.append("photos", file);
			});
			await api.post('/unit', formData, {
				headers: { 'Content-Type': 'multipart/form-data' }
			});
			nav(`/property/${id}`);
		} catch (err) {
			console.error(err);
			setError(err?.response?.data?.error || err.message || 'Failed to create unit');
		} finally {
			setLoading(false);
		}
	};

	// New state for photos and additional info
	const [photos, setPhotos] = useState([]);
	const [extraPhotos, setExtraPhotos] = useState([]);
	const [rooms, setRooms] = useState(1);
	const [halls, setHalls] = useState(1);
	const [bathrooms, setBathrooms] = useState(1);
	const [balcony, setBalcony] = useState("No");
	const [mapLink, setMapLink] = useState("");
	const [description, setDescription] = useState("");

	const handlePhotoChange = e => {
		setPhotos(Array.from(e.target.files));
	};
	const handleExtraPhotoChange = e => {
		setExtraPhotos(prev => [...prev, ...Array.from(e.target.files)]);
	};

	return (
		<div className="page-container form-container">
			<div className="page-header">
				<h1 className="page-title">Add New Unit</h1>
				<p className="page-subtitle">Create a unit for this property</p>
			</div>
      
			<form onSubmit={submit}>
				<div className="form-section">
					<div className="form-section-title">Basic Info</div>
					<div className="form-row">
						<div className="form-group">
							<label className="form-label">Unit Number</label>
							<input 
								value={number} 
								onChange={e => setNumber(e.target.value)} 
								placeholder="e.g., 101" 
								required
							/>
						</div>
						<div className="form-group">
							<label className="form-label">Monthly Rent (INR)</label>
							<input 
								value={rent} 
								onChange={e => setRent(e.target.value)} 
								placeholder="e.g., 15000" 
								type="number"
								required
							/>
						</div>
					</div>
					{/* Multiple Photos */}
					<div className="form-group">
						<label className="form-label">Photos</label>
						<input type="file" multiple accept="image/*" onChange={handlePhotoChange} />
						{photos.length > 0 && (
							<div style={{marginTop:'0.5rem'}}>
								{photos.map((file, idx) => (
									<span key={idx} style={{marginRight:'8px'}}>{file.name}</span>
								))}
							</div>
						)}
					</div>
				</div>
        
				<div className="form-section">
					<div className="form-section-title">Amenities</div>
					<p className="form-hint" style={{marginBottom:'1rem'}}>Add extra charges for amenities</p>
          
					<AmenityRow 
						label="amenity 1"
						value={amenity1} 
						onChange={setAmenity1} 
						expense={amenity1Expense} 
						onExpenseChange={setAmenity1Expense}
					/>
					<AmenityRow 
						label="amenity 2"
						value={amenity2} 
						onChange={setAmenity2} 
						expense={amenity2Expense} 
						onExpenseChange={setAmenity2Expense}
					/>
					<AmenityRow 
						label="amenity 3"
						value={amenity3} 
						onChange={setAmenity3} 
						expense={amenity3Expense} 
						onExpenseChange={setAmenity3Expense}
					/>
					<AmenityRow 
						label="amenity 4"
						value={amenity4} 
						onChange={setAmenity4} 
						expense={amenity4Expense} 
						onExpenseChange={setAmenity4Expense}
					/>
				</div>

				<div className="form-section">
					<div className="form-section-title">Additional Description</div>
					<div className="form-row">
						<div className="form-group">
							<label className="form-label">No. of Rooms</label>
							<input type="number" min="1" value={rooms} onChange={e => setRooms(e.target.value)} required />
						</div>
						<div className="form-group">
							<label className="form-label">No. of Halls</label>
							<input type="number" min="0" value={halls} onChange={e => setHalls(e.target.value)} required />
						</div>
						<div className="form-group">
							<label className="form-label">No. of Bathrooms</label>
							<input type="number" min="1" value={bathrooms} onChange={e => setBathrooms(e.target.value)} required />
						</div>
						<div className="form-group">
							<label className="form-label">Balcony</label>
							<select value={balcony} onChange={e => setBalcony(e.target.value)}>
								<option value="Yes">Yes</option>
								<option value="No">No</option>
							</select>
						</div>
						<div className="form-group">
							<label className="form-label">Google Map Link</label>
							<input type="text" value={mapLink} onChange={e => setMapLink(e.target.value)} placeholder="Paste Google Map link here" />
						</div>
					</div>
					<div className="form-group">
						<label className="form-label">Additional Description</label>
						<textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the unit..." rows={3} />
					</div>
				</div>

				<div className="form-actions">
					<button type="submit" disabled={loading}>
						{loading ? 'Creating...' : 'Create Unit'}
					</button>
					<button type="button" className="btn-secondary" onClick={() => nav(-1)}>
						Cancel
					</button>
				</div>
        
				{error && <div className="error-msg">{error}</div>}
			</form>
		</div>
	);
}
