from rest_framework.views import exception_handler
from rest_framework.exceptions import ValidationError

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    
    if response is not None and isinstance(exc, ValidationError):
        # Format DRF field errors into a single string under the 'detail' key
        if isinstance(response.data, dict):
            # Pick the first error
            first_key = list(response.data.keys())[0]
            first_error = response.data[first_key]
            if isinstance(first_error, list):
                msg = first_error[0]
            else:
                msg = first_error
            response.data = {"detail": str(msg)}
        elif isinstance(response.data, list):
            response.data = {"detail": str(response.data[0])}
            
    return response
