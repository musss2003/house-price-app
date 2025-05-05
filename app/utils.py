# app/utils.py (new helper file or inside main.py if small)

def encode_ocean_proximity(category: str) -> list:
    mapping = ['<1H OCEAN', 'INLAND', 'ISLAND', 'NEAR BAY', 'NEAR OCEAN']
    one_hot = [0] * len(mapping)
    
    if category in mapping:
        one_hot[mapping.index(category)] = 1
    else:
        raise ValueError(f"Unknown ocean_proximity: {category}")
        
    return one_hot

