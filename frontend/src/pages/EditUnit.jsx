import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";

const amenityOptions = ["", "Parking", "Electricity", "Maintenance", "Water", "Internet", "Other"];

export default function EditUnit() {
	const { id, unitId } = useParams();
	const nav = useNavigate();
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
	const [rooms, setRooms] = useState(1);
	const [halls, setHalls] = useState(1);
	const [bathrooms, setBathrooms] = useState(1);
	const [balcony, setBalcony] = useState("No");
	const [mapLink, setMapLink] = useState("");
	const [description, setDescription] = useState("");
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState(null);
	const [photos, setPhotos] = useState([]); // for new uploads
	const [existingPhotos, setExistingPhotos] = useState([]); // for current photos

	useEffect(() => {
		const fetchUnit = async () => {
			try {
				const res = await api.get(`/unit/${unitId}`);
				const unit = res.data;
				setNumber(unit.number || "");
				setRent(unit.rent || "");
				setAmenity1(unit.amenity1 || "");
				setAmenity1Expense(unit.amenity1Expense || "");
				setAmenity2(unit.amenity2 || "");
				setAmenity2Expense(unit.amenity2Expense || "");
				setAmenity3(unit.amenity3 || "");
				setAmenity3Expense(unit.amenity3Expense || "");
				setAmenity4(unit.amenity4 || "");
				setAmenity4Expense(unit.amenity4Expense || "");
				setRooms(unit.rooms || 1);
				setHalls(unit.halls || 1);
				setBathrooms(unit.bathrooms || 1);
				setBalcony(unit.balcony || "No");
				setMapLink(unit.mapLink || "");
				setDescription(unit.description || "");
				setExistingPhotos(unit.photos || []);
			} catch (err) {
				console.error(err);
				setError("Failed to load unit");
			} finally {
				setLoading(false);
			}
		};
		fetchUnit();
	}, [unitId]);

	const submit = async (e) => {
		e.preventDefault();
		try {
			setError(null);
			setSaving(true);
			const formData = new FormData();
			formData.append("number", number);
			formData.append("rent", rent);
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
			photos.forEach(file => formData.append("photos", file));
			formData.append("existingPhotos", JSON.stringify(existingPhotos));
			await api.put(`/unit/${unitId}`, formData, {
				headers: { 'Content-Type': 'multipart/form-data' }
			});
			nav(`/property/${id}`);
		} catch (err) {
			console.error(err);
			setError(err?.response?.data?.error || err.message || "Failed to update unit");
		} finally {
			setSaving(false);
		}
	};

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
				onChange={e => onExpenseChange(e.target.value)} 
				placeholder="Cost"
				disabled={!value}
			/>
		</div>
	);

	// Photo handlers
	const handlePhotoChange = e => {
		setPhotos(Array.from(e.target.files));
	};
	const handleDeletePhoto = idx => {
		setExistingPhotos(prev => prev.filter((_, i) => i !== idx));
	};

	if (loading) return <div className="loading">Loading unit...</div>;

	return (
		<div className="page-container form-container">
			<div className="page-header">
				<h1 className="page-title">Edit Unit</h1>
				<p className="page-subtitle">Update unit details and amenities</p>
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
					{/* Photo management */}
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
						{existingPhotos.length > 0 && (
							<div style={{marginTop:'0.5rem'}}>
								<div>Existing Photos:</div>
								{existingPhotos.map((photo, idx) => (
									<div key={idx} style={{display:'flex',alignItems:'center',marginBottom:'4px'}}>
										<img src={`http://localhost:5000/${photo}`} alt="unit" style={{width:60,height:60,objectFit:'cover',marginRight:'8px',borderRadius:'4px'}} />
										<span style={{color:'#d32f2f',cursor:'pointer',fontSize:'0.9em',marginLeft:'4px'}} onClick={() => handleDeletePhoto(idx)}>delete</span>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
        
				<div className="form-section">
					<div className="form-section-title">Amenities</div>
					<p className="form-hint" style={{marginBottom:'1rem'}}>Extra charges for amenities</p>
          
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

				<div className="form-actions">
					<button type="submit" disabled={saving}>
						{saving ? 'Saving...' : 'Save Changes'}
					</button>
					<button type="button" className="btn-secondary" onClick={() => nav(`/property/${id}`)}>
						Cancel
					</button>
				</div>
        
				{error && <div className="error-msg">{error}</div>}
			</form>
		</div>
	);
}
