from rest_framework.views import exception_handler
from rest_framework.exceptions import ValidationError

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    
    if isinstance(exc, ValidationError) and response is not None:
        if isinstance(response.data, dict):
            # Locate first validation message to put under 'detail' key
            first_error_msg = None
            for key, val in response.data.items():
                if isinstance(val, list) and len(val) > 0:
                    first_error_msg = val[0]
                elif isinstance(val, str):
                    first_error_msg = val
                
                if first_error_msg:
                    break
            
            if first_error_msg:
                response.data['detail'] = first_error_msg
        elif isinstance(response.data, list) and len(response.data) > 0:
            first_error = response.data[0]
            response.data = {
                'detail': first_error
            }
            
    return response
