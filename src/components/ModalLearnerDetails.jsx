const ModalLearnerDetails = ({ onClose, selectedLearner }) => {
	return (
		<div className="w-screen h-screen fixed top-0 left-0 grid place-items-center bg-black/60 transition duration-150 ease-in-out">
			
            <div className="bg-white p-6 rounded shadow-lg w-96 relative">
				<button
					className="absolute p-4 top-1 right-1 text-lg"
					onClick={onClose}>
					X
				</button>
				<h2 className="text-2xl font-bold mb-4">Learner Details</h2>
				<p className="mb-2">
					<strong>Name:</strong> {selectedLearner ? selectedLearner.name : ''}
				</p>
                
                <p className="mb-2">
                    <strong>Cohort:</strong> {selectedLearner ? selectedLearner.cohort : ''}  
                </p>

			</div>

		</div>
	);
};

export default ModalLearnerDetails;
